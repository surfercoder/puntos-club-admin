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
  neq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', name: 'Test Category' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategory,
} from '@/actions/dashboard/category/actions';

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
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Category' }, error: null });
});

describe('createCategory', () => {
  it('should create a category successfully', async () => {
    const result = await createCategory({ name: 'New Category' });
    expect(mockSupabase.from).toHaveBeenCalledWith('category');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'New Category', organization_id: 123 }),
    ]);
    expect(result.data).toEqual({ id: '1', name: 'Test Category' });
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createCategory({ name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createCategory({ name: 'Test' });
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should return error when active_org_id is non-numeric', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'abc' });
    const result = await createCategory({ name: 'Test' });
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should return supabase error on insert failure', async () => {
    const supaError = { message: 'Insert failed', code: '23505' };
    mockSupabase.single.mockReturnValue({ data: null, error: supaError });
    const result = await createCategory({ name: 'Test' });
    expect(result.error).toEqual(supaError);
  });
});

describe('createCategory - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/category.schema').CategorySchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createCategory({ name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateCategory - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/category.schema').CategorySchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateCategory('1', { name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateCategory', () => {
  it('should update a category successfully', async () => {
    const result = await updateCategory('1', { name: 'Updated' });
    expect(mockSupabase.from).toHaveBeenCalledWith('category');
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated', organization_id: 123 }),
    );
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateCategory('1', { name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updateCategory('1', { name: 'Test' });
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should return supabase error on update failure', async () => {
    const supaError = { message: 'Update failed' };
    mockSupabase.single.mockReturnValue({ data: null, error: supaError });
    const result = await updateCategory('1', { name: 'Test' });
    expect(result.error).toEqual(supaError);
  });
});

describe('deleteCategory', () => {
  it('should delete a category successfully', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteCategory('1');
    expect(mockSupabase.from).toHaveBeenCalledWith('category');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await deleteCategory('1');
    expect(result).toEqual({ error: { message: 'Missing active organization' } });
  });

  it('should return supabase error on delete failure', async () => {
    const supaError = { message: 'Delete failed' };
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: supaError });
    const result = await deleteCategory('1');
    expect(result.error).toEqual(supaError);
  });
});

describe('getCategories', () => {
  it('should return categories filtered by org', async () => {
    const mockData = [{ id: '1', name: 'Cat1' }];
    mockSupabase.eq.mockReturnValue({ data: mockData, error: null });
    const result = await getCategories();
    expect(mockSupabase.from).toHaveBeenCalledWith('category');
    expect(mockSupabase.select).toHaveBeenCalledWith('*');
    expect(mockSupabase.order).toHaveBeenCalledWith('name');
    expect(result.data).toEqual(mockData);
  });

  it('should not filter by org when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    // When no org, no eq call after order, so order returns the final result
    mockSupabase.order.mockReturnValue({ data: [], error: null });
    const result = await getCategories();
    expect(result.data).toEqual([]);
  });

  it('should return error on supabase failure', async () => {
    const supaError = { message: 'Fetch failed' };
    mockSupabase.eq.mockReturnValue({ data: null, error: supaError });
    const result = await getCategories();
    expect(result.error).toEqual(supaError);
  });
});

describe('getCategory', () => {
  it('should return a category by id', async () => {
    const result = await getCategory('1');
    expect(mockSupabase.from).toHaveBeenCalledWith('category');
    expect(result.data).toEqual({ id: '1', name: 'Test Category' });
  });

  it('should return error on supabase failure', async () => {
    const supaError = { message: 'Not found' };
    mockSupabase.single.mockReturnValue({ data: null, error: supaError });
    const result = await getCategory('999');
    expect(result.error).toEqual(supaError);
  });

  it('should not filter by org when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await getCategory('1');
    expect(result.data).toBeDefined();
  });
});
