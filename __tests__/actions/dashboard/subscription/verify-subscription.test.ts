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

import { verifySubscriptionAction } from '@/actions/dashboard/subscription/verify-subscription';

describe('verifySubscriptionAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } },
      error: null,
    });
    mockAdminSupabase.maybeSingle.mockReturnValue({ data: null });
  });

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not auth' },
    });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.error).toBe('No autenticado');
  });

  it('returns error when no preapprovalId', async () => {
    const result = await verifySubscriptionAction('');
    expect(result.error).toBe('preapprovalId requerido');
  });

  it('returns mapped status when existing subscription found', async () => {
    mockGet.mockResolvedValueOnce({ status: 'pending' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({
      data: { id: 10, organization_id: 5, plan: 'advance' },
    });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('pending');
    expect(result.plan).toBe('advance');
  });

  it('updates org plan when status is authorized', async () => {
    mockGet.mockResolvedValueOnce({ status: 'authorized' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({
      data: { id: 10, organization_id: 5, plan: 'pro' },
    });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('authorized');
    expect(result.plan).toBe('pro');

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

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('authorized');
    expect(result.plan).toBe('pro');
  });

  it('defaults plan to advance when external_reference has no valid plan', async () => {
    mockGet.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'org5|invalidplan',
    });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.plan).toBe('advance');
  });

  it('defaults plan to advance when no external_reference at all', async () => {
    mockGet.mockResolvedValueOnce({ status: 'cancelled' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('cancelled');
    expect(result.plan).toBe('advance');
  });

  it('returns error on exception', async () => {
    mockGet.mockRejectedValueOnce(new Error('MP error'));

    const result = await verifySubscriptionAction('pa_123');
    expect(result.error).toBe('Error verificando suscripción');
  });

  it('maps paused status correctly', async () => {
    mockGet.mockResolvedValueOnce({ status: 'paused' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('paused');
  });

  it('maps unknown status to pending', async () => {
    mockGet.mockResolvedValueOnce({ status: 'unknown_status' });
    mockAdminSupabase.maybeSingle.mockReturnValueOnce({ data: null });

    const result = await verifySubscriptionAction('pa_123');
    expect(result.status).toBe('pending');
  });
});
