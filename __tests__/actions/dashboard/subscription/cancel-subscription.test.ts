jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-anon-key',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps-key',
  },
}));

const mockUpdate = jest.fn();
jest.mock('mercadopago/dist/clients/preApproval', () => ({
  PreApproval: jest.fn(() => ({ update: mockUpdate })),
}));

// Chainable supabase admin client mock. Each table-chain call records what
// happened so the tests can assert specific writes happened with the right
// values. The mock supports the two chains used by the action:
//   from(t).select(...).eq(...).in(...).order(...).limit(...).maybeSingle()
//   from(t).select(...).eq(...).maybeSingle()
//   from(t).update(...).eq(...)
const adminCalls: Array<{ table: string; op: 'update' | 'select'; payload?: unknown }> = [];
let appUserResponse: { data: { organization_id: number } | null } = { data: { organization_id: 1 } };
let subscriptionResponse: { data: { id: number; mp_preapproval_id: string; status: string } | null } = {
  data: { id: 10, mp_preapproval_id: 'pa_123', status: 'authorized' },
};

const adminClient = {
  from: jest.fn((table: string) => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn(() => chain);
    chain.eq = jest.fn(() => chain);
    chain.in = jest.fn(() => chain);
    chain.order = jest.fn(() => chain);
    chain.limit = jest.fn(() => chain);
    chain.update = jest.fn((payload: unknown) => {
      adminCalls.push({ table, op: 'update', payload });
      return chain;
    });
    chain.maybeSingle = jest.fn(() => {
      adminCalls.push({ table, op: 'select' });
      if (table === 'app_user') return Promise.resolve(appUserResponse);
      if (table === 'subscription') return Promise.resolve(subscriptionResponse);
      return Promise.resolve({ data: null });
    });
    return chain;
  }),
};
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => adminClient),
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

import { cancelSubscriptionAction } from '@/actions/dashboard/subscription/cancel-subscription';

describe('cancelSubscriptionAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminCalls.length = 0;
    appUserResponse = { data: { organization_id: 1 } };
    subscriptionResponse = {
      data: { id: 10, mp_preapproval_id: 'pa_123', status: 'authorized' },
    };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } },
      error: null,
    });
    mockUpdate.mockResolvedValue({ id: 'pa_123', status: 'cancelled' });
  });

  it('returns error when not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not auth' },
    });

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('No autenticado');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns error when app_user / organization not found', async () => {
    appUserResponse = { data: null };

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('Organización no encontrada');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns error when no active subscription exists', async () => {
    subscriptionResponse = { data: null };

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('No hay suscripción activa para cancelar');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('cancels MP preapproval, flips subscription.status and reverts org to trial', async () => {
    const result = await cancelSubscriptionAction();

    expect(result.success).toBe(true);
    expect(result.preapprovalId).toBe('pa_123');

    expect(mockUpdate).toHaveBeenCalledWith({
      id: 'pa_123',
      body: { status: 'cancelled' },
    });

    const subscriptionUpdate = adminCalls.find(
      (c) => c.table === 'subscription' && c.op === 'update'
    );
    expect(subscriptionUpdate?.payload).toEqual(
      expect.objectContaining({ status: 'cancelled' })
    );

    const orgUpdate = adminCalls.find((c) => c.table === 'organization' && c.op === 'update');
    expect(orgUpdate?.payload).toEqual({ plan: 'trial' });
  });

  it('returns generic error when MP API throws', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('MP down'));

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('Error cancelando suscripción');

    // DB writes must not happen if MP call failed
    const orgUpdate = adminCalls.find((c) => c.table === 'organization' && c.op === 'update');
    expect(orgUpdate).toBeUndefined();
  });

  it('still cleans up DB when MP returns "resource not found"', async () => {
    // MP responds 404 when the preapproval no longer exists on their side
    // (stale row, deleted out-of-band). Local cleanup must still run so the
    // org can recover.
    mockUpdate.mockRejectedValueOnce({
      status: 404,
      error: 'resource not found',
      message: 'Resource not found',
    });

    const result = await cancelSubscriptionAction();

    expect(result.success).toBe(true);
    expect(result.preapprovalId).toBe('pa_123');

    const subscriptionUpdate = adminCalls.find(
      (c) => c.table === 'subscription' && c.op === 'update'
    );
    expect(subscriptionUpdate?.payload).toEqual(
      expect.objectContaining({ status: 'cancelled' })
    );

    const orgUpdate = adminCalls.find((c) => c.table === 'organization' && c.op === 'update');
    expect(orgUpdate?.payload).toEqual({ plan: 'trial' });
  });

  it('still cleans up DB when MP throws an object whose error string is "resource not found" without an explicit 404 status', async () => {
    // The MP SDK sometimes raises the "resource not found" message without a
    // populated status field. We should still treat it as a soft 404.
    mockUpdate.mockRejectedValueOnce({ error: 'Resource Not Found' });

    const result = await cancelSubscriptionAction();

    expect(result.success).toBe(true);

    const orgUpdate = adminCalls.find((c) => c.table === 'organization' && c.op === 'update');
    expect(orgUpdate?.payload).toEqual({ plan: 'trial' });
  });

  it('returns generic error when MP throws an object with an unrelated error string', async () => {
    mockUpdate.mockRejectedValueOnce({ error: 'something else entirely' });

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('Error cancelando suscripción');

    const orgUpdate = adminCalls.find((c) => c.table === 'organization' && c.op === 'update');
    expect(orgUpdate).toBeUndefined();
  });

  it('returns generic error when MP rejects with null', async () => {
    mockUpdate.mockRejectedValueOnce(null);

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('Error cancelando suscripción');
  });

  it('returns generic error when MP rejects with a string primitive', async () => {
    mockUpdate.mockRejectedValueOnce('opaque failure');

    const result = await cancelSubscriptionAction();
    expect(result.error).toBe('Error cancelando suscripción');
  });
});
