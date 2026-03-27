jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key',
  },
}));

const mockGet = jest.fn();
jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn(() => ({ get: mockGet })),
}));

const mockAdminSupabase = {
  from: jest.fn(() => mockAdminSupabase),
  select: jest.fn(() => mockAdminSupabase),
  update: jest.fn(() => mockAdminSupabase),
  eq: jest.fn(() => mockAdminSupabase),
  maybeSingle: jest.fn(() => ({ data: null })),
};
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => mockAdminSupabase),
}));

const mockSupabase = {
  auth: { getUser: jest.fn() },
};
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

jest.mock('@/lib/mercadopago/client', () => ({
  getMercadoPagoClient: jest.fn(() => ({})),
}));

import { POST } from '@/app/api/mercadopago/verify-subscription/route';

function createRequest(body: object) {
  return {
    json: () => Promise.resolve(body),
    headers: { get: () => null },
  } as any;
}

describe('MercadoPago Verify Subscription Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } },
      error: null,
    });
    mockAdminSupabase.maybeSingle.mockReturnValue({ data: null });
  });

  it('returns 401 when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not auth' },
    });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('No autenticado');
  });

  it('returns 400 when no preapprovalId', async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('preapprovalId requerido');
  });

  it('returns mapped status when existing subscription found', async () => {
    mockGet.mockResolvedValueOnce({ status: 'pending' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({
      data: { id: 10, organization_id: 5, plan: 'advance' },
    });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('pending');
    expect(data.plan).toBe('advance');
  });

  it('updates org plan when status is authorized', async () => {
    mockGet.mockResolvedValueOnce({ status: 'authorized' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({
      data: { id: 10, organization_id: 5, plan: 'pro' },
    });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('authorized');
    expect(data.plan).toBe('pro');

    // Verify org update was called (from().update().eq() chain for organization)
    expect(mockAdminSupabase.from).toHaveBeenCalledWith('organization');
    expect(mockAdminSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ plan: 'pro' })
    );
  });

  it('falls back to external_reference when no existing subscription', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'authorized',
      external_reference: 'org5|pro',
    });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('authorized');
    expect(data.plan).toBe('pro');
  });

  it('defaults plan to advance when external_reference has no valid plan', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'org5|invalidplan',
    });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.plan).toBe('advance');
  });

  it('defaults plan to advance when no external_reference at all', async () => {
    mockGet.mockResolvedValueOnce({ status: 'cancelled' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('cancelled');
    expect(data.plan).toBe('advance');
  });

  it('returns 500 on error', async () => {
    mockGet.mockRejectedValueOnce(new Error('MP error'));

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Error verificando suscripción');
  });

  it('maps paused status correctly', async () => {
    mockGet.mockResolvedValueOnce({ status: 'paused' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    const data = await response.json();
    expect(data.status).toBe('paused');
  });

  it('maps unknown status to pending', async () => {
    mockGet.mockResolvedValueOnce({ status: 'unknown_status' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const response = await POST(createRequest({ preapprovalId: 'pa_123' }));
    const data = await response.json();
    expect(data.status).toBe('pending');
  });
});
