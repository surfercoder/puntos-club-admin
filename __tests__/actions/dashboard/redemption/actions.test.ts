jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const mockCookieStore = {
  get: jest.fn((name: string) => (name === 'active_org_id' ? { value: '123' } : undefined)),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({ cookies: jest.fn(() => mockCookieStore) }));

type RpcResult = { data: unknown; error: { message: string } | null };

const rpcImpl = jest.fn<RpcResult, [string, Record<string, unknown>]>();

// `.delete()` gets its own chain so the org filter added to the delete path
// does not have to share `eq` call-ordering with the status lookup.
// Awaiting a non-thenable yields the object itself, so `error` is the result.
const deleteChain: any = {
  eq: jest.fn(() => deleteChain),
  error: null,
};

const fromChain: any = {
  select: jest.fn(() => fromChain),
  delete: jest.fn(() => deleteChain),
  eq: jest.fn(() => fromChain),
  order: jest.fn(() => fromChain),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

const mockSupabase = {
  from: jest.fn(() => fromChain),
  rpc: jest.fn((name: string, args: Record<string, unknown>) => rpcImpl(name, args)),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
// requireUser and getMutationOrgId both resolve the current user; keep them off
// the shared query mock so they don't consume its `single()` sequencing.
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(async () => ({ id: 1, organization_id: 123 })),
}));

import { getCurrentUser } from '@/lib/auth/get-current-user';
import {
  createRedemption,
  updateRedemption,
  deleteRedemption,
  deliverRedemption,
  cancelRedemption,
} from '@/actions/dashboard/redemption/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) =>
    name === 'active_org_id' ? { value: '123' } : undefined
  );
  fromChain.select.mockReturnValue(fromChain);
  fromChain.delete.mockReturnValue(deleteChain);
  fromChain.eq.mockReturnValue(fromChain);
  fromChain.order.mockReturnValue(fromChain);
  fromChain.single.mockReturnValue({ data: { id: '1' }, error: null });
  fromChain.maybeSingle.mockReturnValue({ data: { status: 'delivered' }, error: null });
  deleteChain.eq.mockReturnValue(deleteChain);
  deleteChain.error = null;
  mockSupabase.from.mockReturnValue(fromChain);
  (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, organization_id: 123 });
  rpcImpl.mockReset();
});

const validRedemption = {
  beneficiary_id: '1',
  product_id: '2',
  points_used: 100,
  organization_id: '10',
};

describe('createRedemption', () => {
  it('returns field errors on schema failure', async () => {
    const result = await createRedemption({ beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('returns INVALID_INPUT when ids cannot be parsed to numbers', async () => {
    const result = await createRedemption({
      beneficiary_id: 'not-a-number',
      product_id: '2',
      points_used: 100,
      organization_id: '10',
    } as any);
    expect(result.error).toEqual({ message: 'INVALID_INPUT' });
  });

  it('maps known request_redemption rpc error', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'INSUFFICIENT_POINTS detail' } }));
    const result = await createRedemption(validRedemption as any);
    expect(rpcImpl).toHaveBeenCalledWith('request_redemption', expect.objectContaining({
      p_beneficiary_id: 1,
      p_product_id: 2,
      p_organization_id: 10,
    }));
    expect(result.error).toEqual({ message: 'INSUFFICIENT_POINTS' });
  });

  it('returns unmapped rpc error message verbatim', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'random-db-failure' } }));
    const result = await createRedemption(validRedemption as any);
    expect(result.error).toEqual({ message: 'random-db-failure' });
  });

  it('returns UNKNOWN_ERROR when rpc error message is null/undefined', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: undefined as any } }));
    const result = await createRedemption(validRedemption as any);
    expect(result.error).toEqual({ message: 'UNKNOWN_ERROR' });
  });

  it('returns UNKNOWN_ERROR when request_redemption returns no id', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: null }));
    const result = await createRedemption(validRedemption as any);
    expect(result.error).toEqual({ message: 'UNKNOWN_ERROR' });
  });

  it('maps known deliver_redemption rpc error', async () => {
    rpcImpl
      .mockImplementationOnce(() => ({ data: { id: 99 }, error: null }))
      .mockImplementationOnce(() => ({ data: null, error: { message: 'OUT_OF_STOCK now' } }));
    const result = await createRedemption(validRedemption as any);
    expect(rpcImpl).toHaveBeenNthCalledWith(2, 'deliver_redemption', { p_redemption_id: 99 });
    expect(result.error).toEqual({ message: 'OUT_OF_STOCK' });
  });

  it('returns delivered redemption on full success', async () => {
    rpcImpl
      .mockImplementationOnce(() => ({ data: { id: 99 }, error: null }))
      .mockImplementationOnce(() => ({ data: { id: 99, status: 'delivered' }, error: null }));
    const result = await createRedemption(validRedemption as any);
    expect(result.data).toEqual({ id: 99, status: 'delivered' });
    expect(result.error).toBeNull();
  });
});

describe('createRedemption - empty path validation', () => {
  it('skips validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createRedemption({ beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deliverRedemption', () => {
  it('returns delivered data on success', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: { id: 1, status: 'delivered' }, error: null }));
    const result = await deliverRedemption('1');
    expect(rpcImpl).toHaveBeenCalledWith('deliver_redemption', { p_redemption_id: 1 });
    expect(result.data).toEqual({ id: 1, status: 'delivered' });
    expect(result.error).toBeNull();
  });

  it('maps rpc error', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'PRODUCT_NOT_FOUND' } }));
    const result = await deliverRedemption('1');
    expect(result.error).toEqual({ message: 'PRODUCT_NOT_FOUND' });
  });
});

describe('cancelRedemption', () => {
  it('calls rpc with reason when provided', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: { id: 1, status: 'cancelled' }, error: null }));
    const result = await cancelRedemption('1', 'changed mind');
    expect(rpcImpl).toHaveBeenCalledWith('cancel_redemption', { p_redemption_id: 1, p_reason: 'changed mind' });
    expect(result.error).toBeNull();
  });

  it('calls rpc with null reason when omitted', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: { id: 1 }, error: null }));
    await cancelRedemption('1');
    expect(rpcImpl).toHaveBeenCalledWith('cancel_redemption', { p_redemption_id: 1, p_reason: null });
  });

  it('maps rpc error', async () => {
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'REDEMPTION_NOT_PENDING' } }));
    const result = await cancelRedemption('1');
    expect(result.error).toEqual({ message: 'REDEMPTION_NOT_PENDING' });
  });
});

describe('updateRedemption', () => {
  it('is a validated no-op that touches no rows', async () => {
    const result = await updateRedemption('1', validRedemption as any);
    expect(result).toEqual({ data: null, error: null });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('returns field errors on invalid input', async () => {
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('updateRedemption - empty path validation', () => {
  it('skips validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', points_used: 0 } as any);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deleteRedemption', () => {
  it('cancels via rpc when row is pending', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: { status: 'pending' }, error: null });
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: null }));
    const result = await deleteRedemption('1');
    expect(rpcImpl).toHaveBeenCalledWith('cancel_redemption', expect.objectContaining({ p_redemption_id: 1 }));
    expect(result.error).toBeNull();
  });

  it('maps rpc error when cancel fails', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: { status: 'pending' }, error: null });
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'REDEMPTION_NOT_PENDING' } }));
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'REDEMPTION_NOT_PENDING' });
  });

  it('physically deletes when row is not pending', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: { status: 'delivered' }, error: null });
    const result = await deleteRedemption('1');
    expect(fromChain.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('returns delete error when physical delete fails', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: { status: 'delivered' }, error: null });
    deleteChain.error = { message: 'Error' };
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'Error' });
  });

  it('surfaces a lookup failure instead of reporting it as not found', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: null, error: { message: 'connection reset' } });
    const result = await deleteRedemption('1');
    expect(fromChain.delete).not.toHaveBeenCalled();
    expect(result.error).toEqual({ message: 'connection reset' });
  });

  it('does not delete when the row is not in the active org', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: null, error: null });
    const result = await deleteRedemption('1');
    expect(fromChain.delete).not.toHaveBeenCalled();
    expect(result.error).toEqual({ message: 'REDEMPTION_NOT_FOUND' });
  });

  it('scopes both the lookup and the delete to the active org', async () => {
    fromChain.maybeSingle.mockReturnValueOnce({ data: { status: 'delivered' }, error: null });
    await deleteRedemption('1');
    expect(fromChain.eq).toHaveBeenCalledWith('organization_id', 123);
    expect(deleteChain.eq).toHaveBeenCalledWith('organization_id', 123);
  });

  it('returns an error when there is no active organization', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 1, organization_id: null });
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'Missing active organization' });
    expect(fromChain.delete).not.toHaveBeenCalled();
  });
});
