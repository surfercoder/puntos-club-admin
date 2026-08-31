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
