jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: '123' })),
    set: jest.fn(),
  })),
}));

type RpcResult = { data: unknown; error: { message: string } | null };

const rpcImpl = jest.fn<RpcResult, [string, Record<string, unknown>]>();

const fromChain: any = {
  select: jest.fn(() => fromChain),
  delete: jest.fn(() => fromChain),
  eq: jest.fn(() => fromChain),
  order: jest.fn(() => fromChain),
  single: jest.fn(),
};

const mockSupabase = {
  from: jest.fn(() => fromChain),
  rpc: jest.fn((name: string, args: Record<string, unknown>) => rpcImpl(name, args)),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createRedemption,
  updateRedemption,
  deleteRedemption,
  deliverRedemption,
  cancelRedemption,
  getRedemptions,
  getRedemption,
} from '@/actions/dashboard/redemption/actions';

beforeEach(() => {
  jest.clearAllMocks();
  fromChain.select.mockReturnValue(fromChain);
  fromChain.delete.mockReturnValue(fromChain);
  fromChain.eq.mockReturnValue(fromChain);
  fromChain.order.mockReturnValue(fromChain);
  fromChain.single.mockReturnValue({ data: { id: '1' }, error: null });
  mockSupabase.from.mockReturnValue(fromChain);
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
  it('reads redemption row on success', async () => {
    fromChain.single.mockReturnValueOnce({ data: { id: '1' }, error: null });
    const result = await updateRedemption('1', validRedemption as any);
    expect(mockSupabase.from).toHaveBeenCalledWith('redemption');
    expect(result.data).toEqual({ id: '1' });
    expect(result.error).toBeNull();
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
    fromChain.single.mockReturnValueOnce({ data: { status: 'pending' }, error: null });
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: null }));
    const result = await deleteRedemption('1');
    expect(rpcImpl).toHaveBeenCalledWith('cancel_redemption', expect.objectContaining({ p_redemption_id: 1 }));
    expect(result.error).toBeNull();
  });

  it('maps rpc error when cancel fails', async () => {
    fromChain.single.mockReturnValueOnce({ data: { status: 'pending' }, error: null });
    rpcImpl.mockImplementationOnce(() => ({ data: null, error: { message: 'REDEMPTION_NOT_PENDING' } }));
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'REDEMPTION_NOT_PENDING' });
  });

  it('physically deletes when row is not pending', async () => {
    fromChain.single.mockReturnValueOnce({ data: { status: 'delivered' }, error: null });
    fromChain.eq.mockReturnValueOnce(fromChain).mockReturnValueOnce({ error: null });
    const result = await deleteRedemption('1');
    expect(fromChain.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('returns delete error when physical delete fails', async () => {
    fromChain.single.mockReturnValueOnce({ data: { status: 'delivered' }, error: null });
    fromChain.eq.mockReturnValueOnce(fromChain).mockReturnValueOnce({ error: { message: 'Error' } });
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'Error' });
  });

  it('physically deletes when no row is found', async () => {
    fromChain.single.mockReturnValueOnce({ data: null, error: null });
    fromChain.eq.mockReturnValueOnce(fromChain).mockReturnValueOnce({ error: null });
    const result = await deleteRedemption('1');
    expect(result.error).toBeNull();
  });
});

describe('getRedemptions', () => {
  it('returns rows', async () => {
    fromChain.order.mockReturnValueOnce({ data: [{ id: '1' }], error: null });
    const result = await getRedemptions();
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('returns error on failure', async () => {
    fromChain.order.mockReturnValueOnce({ data: null, error: { message: 'Error' } });
    const result = await getRedemptions();
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('getRedemption', () => {
  it('returns row by id', async () => {
    const result = await getRedemption('1');
    expect(result.data).toEqual({ id: '1' });
  });

  it('returns error on failure', async () => {
    fromChain.single.mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await getRedemption('999');
    expect(result.error).toEqual({ message: 'Not found' });
  });
});
