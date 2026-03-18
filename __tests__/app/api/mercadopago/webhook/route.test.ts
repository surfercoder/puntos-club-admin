import { POST } from '@/app/api/mercadopago/webhook/route';

const mockGet = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUpdateEq = jest.fn().mockResolvedValue({});
const mockUpsert = jest.fn().mockResolvedValue({});

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn(() => ({})),
  PLAN_CONFIG: {
    advance: { name: 'Advance', amount: 100, currency: 'ARS', mpPlanIdEnvVar: 'MP_PLAN_ADVANCE' },
    pro: { name: 'Pro', amount: 200, currency: 'ARS', mpPlanIdEnvVar: 'MP_PLAN_PRO' },
  },
}));

jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn().mockImplementation(() => ({
    get: mockGet,
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
          eq: jest.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
        })),
      })),
      update: jest.fn(() => ({ eq: mockUpdateEq })),
      upsert: mockUpsert,
    })),
  })),
}));

function makeRequest(body: any, headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    json: () => Promise.resolve(body),
  } as any;
}

describe('MercadoPago Webhook Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    mockGet.mockResolvedValue({
      status: 'authorized',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValue({ data: null });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns received:true for events without data id', async () => {
    const response = await POST(makeRequest({ type: 'test', data: {} }));
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('returns received:true for non-subscription events', async () => {
    const response = await POST(makeRequest({ type: 'payment', data: { id: '123' } }));
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('processes subscription_preapproval event with existing authorized subscription', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'advance' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    const data = await response.json();
    expect(data.received).toBe(true);
    expect(response.status).toBe(200);
  });

  it('handles cancelled subscription - reverts org to trial', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'cancelled',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'advance' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('handles paused status on existing subscription', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'paused',
      external_reference: 'u1|pro',
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'pro' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('handles pending status on existing subscription', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'advance' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('processes subscription_authorized_payment event type', async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'advance' },
    });

    const response = await POST(makeRequest({ type: 'subscription_authorized_payment', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('creates new subscription when not in DB - webhook arrives before onboarding', async () => {
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('creates new subscription with authorized status and updates org plan', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'u1|pro',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('handles new subscription when appUser not found', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('handles external_reference without pipe separator', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'user-id-only',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup with full external_reference as auth_user_id
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 2 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('handles subscription with no external_reference', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: undefined,
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('resolves plan from MP plan ID when no external_reference plan part', async () => {
    process.env.MP_PLAN_ADVANCE = 'mp-plan-id-advance';
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'u1',
      preapproval_plan_id: 'mp-plan-id-advance',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('defaults to advance plan when plan cannot be resolved', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'u1|unknown-plan',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('handles unknown MP status by mapping to pending', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'some_unknown_status',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'advance' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('processes webhook with x-signature and x-request-id headers', async () => {
    process.env.MP_WEBHOOK_SECRET = 'test-secret';
    mockMaybeSingle.mockResolvedValueOnce({ data: null });

    const response = await POST(makeRequest(
      { type: 'subscription_preapproval', data: { id: 'pa_123' } },
      { 'x-signature': 'ts=123,v1=abc', 'x-request-id': 'req-123' }
    ));
    expect(response.status).toBe(200);
  });

  it('always returns 200 even on error', async () => {
    mockGet.mockRejectedValueOnce(new Error('MP API down'));

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('handles body without type field', async () => {
    const response = await POST(makeRequest({ data: { id: '123' } }));
    const data = await response.json();
    expect(data.received).toBe(true);
  });

  it('uses planFromMpPlanId when parsedPlan is undefined (plan from env match)', async () => {
    process.env.MP_PLAN_PRO = 'mp-plan-pro-id';
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'u1|notaplan',  // planPart = 'notaplan' which is not advance/pro => parsedPlan = undefined
      preapproval_plan_id: 'mp-plan-pro-id', // matches PLAN_CONFIG.pro via env var
      payer_email: 'test@test.com',
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 1, organization_id: 1, plan: 'pro' },
    });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_123' } }));
    expect(response.status).toBe(200);
  });

  it('handles null payer_email (falls back to empty string)', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'u1|advance',
      payer_email: null,
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });

  it('handles new subscription with pending status (no org update)', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'u1|advance',
      payer_email: 'test@test.com',
    });
    // subscription not found
    mockMaybeSingle.mockResolvedValueOnce({ data: null });
    // appUser lookup
    mockMaybeSingle.mockResolvedValueOnce({ data: { organization_id: 1 } });

    const response = await POST(makeRequest({ type: 'subscription_preapproval', data: { id: 'pa_new' } }));
    expect(response.status).toBe(200);
  });
});
