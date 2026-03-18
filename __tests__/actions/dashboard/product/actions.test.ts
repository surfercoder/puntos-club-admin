jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const mockCookieStore = {
  get: jest.fn((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  }),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', name: 'Test Product' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, role: { name: 'admin' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => true),
}));

import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProduct,
} from '@/actions/dashboard/product/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { isAdmin } from '@/lib/auth/roles';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  });
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Product' }, error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
  (isAdmin as jest.Mock).mockReturnValue(true);
});

const validProduct = {
  name: 'Product 1',
  category_id: '5',
  required_points: 100,
  active: true,
};

describe('createProduct', () => {
  it('should create a product successfully', async () => {
    const result = await createProduct(validProduct);
    expect(mockSupabase.from).toHaveBeenCalledWith('product');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Product 1', organization_id: 123 }),
    ]);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createProduct(validProduct);
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should return error when plan limit reached', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit reached' });
    const result = await createProduct(validProduct);
    expect(result).toEqual({ data: null, error: { message: 'Limit reached' } });
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createProduct(validProduct);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('updateProduct', () => {
  it('should update a product successfully', async () => {
    const result = await updateProduct('1', validProduct);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updateProduct('1', validProduct);
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });
});

describe('deleteProduct', () => {
  it('should delete a product successfully', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteProduct('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await deleteProduct('1');
    expect(result).toEqual({ error: { message: 'Missing active organization' } });
  });
});

describe('getProducts', () => {
  it('should return all products for admin', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getProducts();
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should filter by org for non-admin', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockSupabase.eq.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getProducts();
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should not filter by org for non-admin when no org cookie', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockCookieStore.get.mockReturnValue(undefined);
    mockSupabase.order.mockReturnValue({ data: [], error: null });
    const result = await getProducts();
    expect(result.data).toEqual([]);
  });
});

describe('getProduct', () => {
  it('should return a product by id', async () => {
    const result = await getProduct('1');
    expect(result.data).toEqual({ id: '1', name: 'Test Product' });
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getProduct('999');
    expect(result.error).toEqual({ message: 'Not found' });
  });

  it('should not filter by org when no org cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getProduct('1');
    expect(result.data).toBeDefined();
  });

  it('should filter by org when org cookie is present', async () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'active_org_id') return { value: '123' };
      return undefined;
    });
    const result = await getProduct('1');
    expect(result.data).toBeDefined();
  });
});
