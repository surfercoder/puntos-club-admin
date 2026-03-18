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
  single: jest.fn(() => ({ data: { id: '1', name: 'Test Org' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1', email: 'test@test.com' } },
      error: null,
    })),
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, role: { name: 'owner' } })),
}));
jest.mock('@/lib/auth/roles', () => ({
  isAdmin: jest.fn(() => false),
}));

import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizations,
  getOrganization,
  getOrganizationProducts,
} from '@/actions/dashboard/organization/actions';
import { isAdmin } from '@/lib/auth/roles';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Org' }, error: null });
  (isAdmin as jest.Mock).mockReturnValue(false);
});

const validOrg = { name: 'My Org' };

describe('createOrganization', () => {
  it('should create org, fetch user, create app_user_organization for non-admin', async () => {
    // single() calls: 1) org insert, 2) app_user lookup, 3) getCurrentUser internal
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null }) // org insert
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null }); // app_user lookup
    mockSupabase.insert.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);

    const result = await createOrganization(validOrg);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createOrganization({ name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should throw on org insert error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert failed' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Insert failed');
  });

  it('should throw and cleanup when auth fails', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1' }, error: null });
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: { message: 'Auth error' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Not authenticated');
    // Verify cleanup: delete org
    expect(mockSupabase.delete).toHaveBeenCalled();
  });

  it('should throw and cleanup when app_user not found', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1' }, error: null }) // org insert
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } }); // app_user lookup
    await expect(createOrganization(validOrg)).rejects.toThrow('Could not resolve app user');
  });

  it('should skip app_user_organization for admin users', async () => {
    (isAdmin as jest.Mock).mockReturnValue(true);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'admin' } }, error: null });
    const result = await createOrganization(validOrg);
    expect(result.data).toBeDefined();
  });

  it('should throw and cleanup when membership insert fails for non-admin', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null });
    // First insert (org creation) needs to chain, second insert (membership) should fail
    mockSupabase.insert
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: 'Membership failed' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Membership failed');
  });

  it('should use fallback message when membership error has empty message', async () => {
    (isAdmin as jest.Mock).mockReturnValue(false);
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: { id: 'auth-1' } }, error: null });
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'My Org' }, error: null })
      .mockReturnValueOnce({ data: { id: 10, role: { name: 'owner' } }, error: null });
    mockSupabase.insert
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: '' } });
    await expect(createOrganization(validOrg)).rejects.toThrow('Failed to associate user to organization');
  });
});

describe('createOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization.schema').OrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createOrganization({ name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization.schema').OrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateOrganization('1', { name: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('createOrganization - data null but no error', () => {
  it('should throw when org insert returns null data without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    await expect(createOrganization(validOrg)).rejects.toThrow('Failed to create organization');
  });
});

describe('updateOrganization - data null but no error', () => {
  it('should throw when update returns null data without error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    await expect(updateOrganization('1', validOrg)).rejects.toThrow('Failed to update organization');
  });
});

describe('updateOrganization', () => {
  it('should update org successfully', async () => {
    const result = await updateOrganization('1', validOrg);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateOrganization('1', { name: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should throw on update failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update failed' } });
    await expect(updateOrganization('1', validOrg)).rejects.toThrow('Update failed');
  });
});

describe('deleteOrganization', () => {
  it('should delete org successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteOrganization('1');
    expect(result.error).toBeNull();
  });
});

describe('getOrganizations', () => {
  it('should return organizations', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getOrganizations();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getOrganization', () => {
  it('should return org by id', async () => {
    const result = await getOrganization('1');
    expect(result.data).toBeDefined();
  });
});

describe('getOrganizationProducts', () => {
  it('should return products for org', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1', name: 'Product' }], error: null });
    const result = await getOrganizationProducts('1');
    expect(result.data).toEqual([{ id: '1', name: 'Product' }]);
  });
});
