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
import { getCurrentUser } from '@/lib/auth/get-current-user';
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
  (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: 123, role: { name: 'admin' } });
  (isAdmin as jest.Mock).mockReturnValue(true);
});

// Restores console spies even when an assertion throws mid-test, so a failure
// here can never leak a mocked console into the tests that follow.
afterEach(() => {
  jest.restoreAllMocks();
});

const validProduct = {
  name: 'Product 1',
  category_id: '5',
  required_points: 100,
  stock: 25,
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

  it('should fall back to the users own org when the cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createProduct(validProduct);
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ organization_id: 123 }),
    ]);
    expect(result.error).toBeNull();
  });

  it('should return error when neither the cookie nor the user has an org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
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

  it('should persist the stock value it was given', async () => {
    await createProduct(validProduct);
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ stock: 25 }),
    ]);
  });
});

describe('updateProduct', () => {
  it('should update a product scoped to the active org', async () => {
    const result = await updateProduct('1', validProduct);
    expect(mockSupabase.from).toHaveBeenCalledWith('product');
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Product 1', stock: 25, organization_id: 123 })
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 123);
    expect(result.error).toBeNull();
  });

  // The reported bug: editing a product with no org-switcher cookie returned
  // a plain object error, which surfaced as "An unknown error occurred".
  it('should update using the users own org when the cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updateProduct('1', validProduct);
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ stock: 25, organization_id: 123 })
    );
    expect(result.error).toBeNull();
  });

  it('should return error when neither the cookie nor the user has an org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const result = await updateProduct('1', validProduct);
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await updateProduct('1', validProduct);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('deleteProduct', () => {
  it('should delete a product scoped to the active org', async () => {
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ error: null });
    const result = await deleteProduct('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 123);
    expect(result.error).toBeNull();
  });

  it('should return error when neither the cookie nor the user has an org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const result = await deleteProduct('1');
    expect(result).toEqual({ error: { message: 'Missing active organization' } });
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockReturnValueOnce({ error: { message: 'DB error' } });
    const result = await deleteProduct('1');
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('getProducts', () => {
  it('should list products unscoped for admins', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getProducts();
    expect(mockSupabase.from).toHaveBeenCalledWith('product');
    expect(mockSupabase.order).toHaveBeenCalledWith('name');
    // Admins see every org, so no organization_id filter is applied.
    expect(mockSupabase.eq).not.toHaveBeenCalledWith('organization_id', expect.anything());
    expect(result.data).toEqual([{ id: '1' }]);
  });

  it('should scope the list to the org for non-admins', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    // Cookie org == the user's own org, so the filter resolves without a
    // membership lookup.
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: 123 });
    mockSupabase.order.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue({ data: [], error: null });
    await getProducts();
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 123);
  });
});

describe('getProduct', () => {
  it('should fetch one product scoped to the active org', async () => {
    const result = await getProduct('1');
    expect(mockSupabase.from).toHaveBeenCalledWith('product');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', 123);
    expect(result.data).toEqual({ id: '1', name: 'Test Product' });
  });

  it('should fetch without an org filter when the cookie is missing', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    await getProduct('1');
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(mockSupabase.eq).not.toHaveBeenCalledWith('organization_id', expect.anything());
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await getProduct('1');
    expect(result.error).toEqual({ message: 'DB error' });
  });
});
