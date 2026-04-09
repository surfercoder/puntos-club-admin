jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key',
  },
}));

import { POST } from '@/app/api/mercadopago/create-subscription/route';

const mockGetUser = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ data: null, error: null }),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn(() => ({})),
  PLAN_CONFIG: {
    advance: { name: 'Advance', amount: 100, currency: 'ARS', mpPlanIdEnvVar: 'MP_PLAN_ADVANCE' },
    pro: { name: 'Pro', amount: 200, currency: 'ARS', mpPlanIdEnvVar: 'MP_PLAN_PRO' },
  },
}));

jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn().mockImplementation(() => ({
    create: mockCreate,
  })),
}));

describe('MercadoPago Create Subscription Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_SITE_URL: 'https://puntos-club-admin.vercel.app' };
    delete process.env.MP_TEST_PAYER_EMAIL;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@test.com' } }, error: null });
    mockCreate.mockResolvedValue({ init_point: 'https://mp.com/checkout', id: 'pa_123' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid plan', async () => {
    const request = {
      json: () => Promise.resolve({ planId: 'invalid' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Plan inválido');
  });

  it('returns 400 when planId is missing', async () => {
    const request = {
      json: () => Promise.resolve({}),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('creates subscription successfully for advance plan', async () => {
    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.initPoint).toBe('https://mp.com/checkout');
    expect(data.preapprovalId).toBe('pa_123');
  });

  it('uses MP_TEST_PAYER_EMAIL when set instead of the user email', async () => {
    process.env.MP_TEST_PAYER_EMAIL = 'test_payer@mp.com';
    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ payer_email: 'test_payer@mp.com' }),
      }),
    );
    delete process.env.MP_TEST_PAYER_EMAIL;
  });

  it('creates subscription successfully for pro plan', async () => {
    const request = {
      json: () => Promise.resolve({ planId: 'pro' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.initPoint).toBe('https://mp.com/checkout');
  });

  it('uses custom backUrl when provided', async () => {
    const request = {
      json: () => Promise.resolve({ planId: 'advance', backUrl: '/settings/billing' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(200);
    // Verify create was called with back_url containing the custom path
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          back_url: expect.stringContaining('/settings/billing'),
        }),
      })
    );
  });

  it('uses default site URL when NEXT_PUBLIC_SITE_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          back_url: expect.stringContaining('puntos-club-admin.vercel.app'),
        }),
      })
    );
  });

  it('returns 500 when NEXT_PUBLIC_SITE_URL produces invalid URL', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'not-a-url';

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('back_url');
  });

  it('returns 500 when MP create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('MP service error'));

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('MP service error');
  });

  it('handles MP error with cause array', async () => {
    mockCreate.mockRejectedValueOnce({ cause: [{ message: 'bad back_url' }] });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toContain('back_url');
  });

  it('handles MP error with message property (non-Error)', async () => {
    mockCreate.mockRejectedValueOnce({ message: 'Some MP error' });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Some MP error');
  });

  it('handles MP error with error property', async () => {
    mockCreate.mockRejectedValueOnce({ error: 'Some error string' });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Some error string');
  });

  it('handles MP error with unknown shape', async () => {
    mockCreate.mockRejectedValueOnce({});

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Error inesperado');
  });

  it('handles cause array with no message property', async () => {
    mockCreate.mockRejectedValueOnce({ cause: [42] });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('42');
  });

  it('upserts subscription to DB when appUser has organization_id', async () => {
    // Need to override the admin client mock so maybeSingle returns an org
    const mockUpsert = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { organization_id: 42 } });
    const { createAdminClient } = require('@/lib/supabase/admin');
    createAdminClient.mockReturnValue({
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: mockMaybeSingle,
        upsert: mockUpsert,
      })),
    });

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.initPoint).toBe('https://mp.com/checkout');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: 42,
        mp_preapproval_id: 'pa_123',
        status: 'pending',
      }),
      { onConflict: 'mp_preapproval_id' }
    );
  });

  it('appends ngrok hint when error mentions back_url', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Invalid back_url parameter'));

    const request = {
      json: () => Promise.resolve({ planId: 'advance' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toContain('ngrok');
  });
});
