jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: '123' })),
    set: jest.fn(),
  })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createRedemption,
  updateRedemption,
  deleteRedemption,
  getRedemptions,
  getRedemption,
} from '@/actions/dashboard/redemption/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });
});

const validRedemption = {
  beneficiary_id: '1',
  product_id: '2',
  order_id: '3',
  points_used: 100,
  quantity: 1,
};

describe('createRedemption', () => {
  it('should create redemption successfully', async () => {
    const result = await createRedemption(validRedemption);
    expect(mockSupabase.from).toHaveBeenCalledWith('redemption');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createRedemption({ beneficiary_id: '', product_id: '', order_id: '', points_used: 0, quantity: 0 });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createRedemption(validRedemption);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('updateRedemption', () => {
  it('should update redemption successfully', async () => {
    const result = await updateRedemption('1', validRedemption);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', order_id: '', points_used: 0, quantity: 0 });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createRedemption - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createRedemption({ beneficiary_id: '', product_id: '', order_id: '', points_used: 0, quantity: 0 });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateRedemption - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/redemption.schema').RedemptionSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateRedemption('1', { beneficiary_id: '', product_id: '', order_id: '', points_used: 0, quantity: 0 });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deleteRedemption', () => {
  it('should delete redemption successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteRedemption('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deleteRedemption('1');
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('getRedemptions', () => {
  it('should return redemptions', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getRedemptions();
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getRedemptions();
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('getRedemption', () => {
  it('should return a redemption by id', async () => {
    const result = await getRedemption('1');
    expect(result.data).toBeDefined();
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getRedemption('999');
    expect(result.error).toBeDefined();
  });
});
