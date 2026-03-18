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
  single: jest.fn(() => ({ data: { id: 1, street: 'Main St' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
}));

import { createAddress, updateAddress, deleteAddress } from '@/actions/dashboard/address/actions';
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
  mockSupabase.single.mockReturnValue({ data: { id: 1, street: 'Main St' }, error: null });
  (isAdmin as jest.Mock).mockReturnValue(false);
});

const validAddress = {
  street: 'Main St',
  number: '100',
  city: 'Buenos Aires',
  state: 'CABA',
  zip_code: '1000',
};

describe('createAddress', () => {
  it('should create address successfully', async () => {
    const result = await createAddress(validAddress);
    expect(mockSupabase.from).toHaveBeenCalledWith('address');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ street: 'Main St', organization_id: 123 }),
    ]);
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createAddress({ street: '', number: '', city: '', state: '', zip_code: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createAddress(validAddress);
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });
});

describe('createAddress - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/address.schema').AddressSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createAddress({ street: '', number: '', city: '', state: '', zip_code: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateAddress - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/address.schema').AddressSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateAddress(1, { street: '', number: '', city: '', state: '', zip_code: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateAddress', () => {
  it('should update address for non-admin successfully', async () => {
    const result = await updateAddress(1, validAddress);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateAddress(1, { street: '', number: '', city: '', state: '', zip_code: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when non-admin has no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updateAddress(1, validAddress);
    expect(result).toEqual({ data: null, error: { message: 'Missing active organization' } });
  });

  it('should preserve org_id for admin users', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.single.mockReturnValue({ data: { organization_id: 456 }, error: null });
    await updateAddress(1, validAddress);
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: 456 }),
    );
  });

  it('should use active org_id for admin when no existing address found', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    // First single() for fetching existing address returns null, second for update result
    mockSupabase.single
      .mockReturnValueOnce({ data: null, error: null })
      .mockReturnValueOnce({ data: { id: 1 }, error: null });
    const result = await updateAddress(1, validAddress);
    expect(result.data).toBeDefined();
  });
});

describe('deleteAddress', () => {
  it('should delete address for non-admin successfully', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteAddress(1);
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return error when non-admin has no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await deleteAddress(1);
    expect(result).toEqual({ error: { message: 'Missing active organization' } });
  });

  it('should allow admin to delete without org filter', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteAddress(1);
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: 'Error' } });
    const result = await deleteAddress(1);
    expect(result.error).toEqual({ message: 'Error' });
  });
});
