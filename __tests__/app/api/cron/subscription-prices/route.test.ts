const mockMpUpdate = jest.fn();
jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn(() => ({ update: mockMpUpdate })),
}));
jest.mock('@/lib/mercadopago/client', () => ({ getMercadoPagoClient: jest.fn(() => ({})) }));

const mockQuery = jest.fn();
const mockStatusEq = jest.fn((..._args: unknown[]) => mockQuery());
const mockDbUpdate = jest.fn();
const mockDbUpdateEq = jest.fn((..._args: unknown[]) => Promise.resolve({ error: null }));
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: mockStatusEq })),
      update: (payload: unknown) => {
        mockDbUpdate(payload);
        return { eq: mockDbUpdateEq };
      },
    })),
  })),
}));

import { GET } from '@/app/api/cron/subscription-prices/route';

const EXPIRED = '2020-01-01T00:00:00Z';
const ACTIVE = '2999-01-01T00:00:00Z';

function request(authorization?: string) {
  return { headers: { get: () => authorization ?? null } } as never;
}

function sub(overrides: Record<string, unknown>) {
  return {
    id: 1,
    mp_preapproval_id: 'pa_1',
    plan: 'advance',
    amount: 12499,
    currency: 'ARS',
    organization: { promo_ends_at: EXPIRED },
    ...overrides,
  };
}

async function run(rows: unknown[] | null) {
  mockQuery.mockResolvedValue({ data: rows, error: null });
  const response = await GET(request('Bearer s3cret'));
  return { status: response.status, body: await response.json() };
}

describe('GET /api/cron/subscription-prices', () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 's3cret';
    mockMpUpdate.mockResolvedValue({});
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it('refuses to run when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(request('Bearer undefined'));
    expect(response.status).toBe(401);
    expect(mockStatusEq).not.toHaveBeenCalled();
  });

  it.each([undefined, 'Bearer wrong', 's3cret'])('returns 401 for the authorization header %p', async (header) => {
    const response = await GET(request(header));
    expect(response.status).toBe(401);
    expect(mockStatusEq).not.toHaveBeenCalled();
  });

  it('returns 500 when the subscription query fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockQuery.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const response = await GET(request('Bearer s3cret'));
    expect(response.status).toBe(500);
  });

  it('only looks at authorized subscriptions and handles an empty result', async () => {
    expect(await run(null)).toEqual({ status: 200, body: { updated: 0, failed: 0, skipped: 0 } });
    expect(mockStatusEq).toHaveBeenCalledWith('status', 'authorized');
  });

  it('skips orgs still in promo, without a promo date or already at list price', async () => {
    const { body } = await run([
      sub({ organization: { promo_ends_at: ACTIVE } }),
      sub({ organization: { promo_ends_at: null } }),
      sub({ organization: null }),
      sub({ organization: [] }),
      sub({ amount: 24999 }),
    ]);
    expect(body).toEqual({ updated: 0, failed: 0, skipped: 5 });
    expect(mockMpUpdate).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('raises an expired promo to list price in MP and in the db', async () => {
    const { body } = await run([sub({ id: 7, mp_preapproval_id: 'pa_7', plan: 'pro', amount: 31200 })]);
    expect(body).toEqual({ updated: 1, failed: 0, skipped: 0 });
    expect(mockMpUpdate).toHaveBeenCalledWith({
      id: 'pa_7',
      body: { auto_recurring: { transaction_amount: 62400, currency_id: 'ARS' } },
    });
    expect(mockDbUpdate).toHaveBeenCalledWith(expect.objectContaining({ amount: 62400 }));
    expect(mockDbUpdateEq).toHaveBeenCalledWith('id', 7);
  });

  it('reads the org when the join comes back as an array and defaults the currency to ARS', async () => {
    const { body } = await run([sub({ currency: null, organization: [{ promo_ends_at: EXPIRED }] })]);
    expect(body.updated).toBe(1);
    expect(mockMpUpdate).toHaveBeenCalledWith({
      id: 'pa_1',
      body: { auto_recurring: { transaction_amount: 24999, currency_id: 'ARS' } },
    });
  });

  it('leaves the row untouched when MP rejects the update', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockMpUpdate.mockRejectedValue(new Error('MP down'));
    const { body } = await run([sub({})]);
    expect(body).toEqual({ updated: 0, failed: 1, skipped: 0 });
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });
});
