jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', order_number: 'ORD-001' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createAppOrder,
  updateAppOrder,
  deleteAppOrder,
  getAppOrders,
  getAppOrder,
} from '@/actions/dashboard/app_order/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', order_number: 'ORD-001' }, error: null });
});

const validOrder = {
  id: '1',
  order_number: 'ORD-001',
  total_points: 100,
  observations: 'Test',
};

describe('createAppOrder', () => {
  it('should create order successfully', async () => {
    const result = await createAppOrder(validOrder);
    expect(mockSupabase.from).toHaveBeenCalledWith('app_order');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ order_number: 'ORD-001' }),
    ]);
    expect(result.data).toBeDefined();
  });

  it('should throw on supabase error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    await expect(createAppOrder(validOrder)).rejects.toThrow('DB error');
  });
});

describe('updateAppOrder', () => {
  it('should update order successfully', async () => {
    const result = await updateAppOrder('1', validOrder);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should throw on supabase error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    await expect(updateAppOrder('1', validOrder)).rejects.toThrow('DB error');
  });
});

describe('deleteAppOrder', () => {
  it('should delete order successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    await expect(deleteAppOrder('1')).resolves.toBeUndefined();
  });

  it('should throw on supabase error', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'DB error' } });
    await expect(deleteAppOrder('1')).rejects.toThrow('DB error');
  });
});

describe('getAppOrders', () => {
  it('should return orders', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getAppOrders();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getAppOrder', () => {
  it('should return an order by id', async () => {
    const result = await getAppOrder('1');
    expect(result.data).toBeDefined();
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getAppOrder('999');
    expect(result.error).toBeDefined();
  });
});
