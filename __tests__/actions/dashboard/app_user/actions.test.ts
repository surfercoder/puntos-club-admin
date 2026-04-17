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
  single: jest.fn(() => ({ data: { id: '1', name: 'cashier' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

const mockAdminClient: any = {
  from: jest.fn(() => mockAdminClient),
  select: jest.fn(() => mockAdminClient),
  insert: jest.fn(() => mockAdminClient),
  update: jest.fn(() => mockAdminClient),
  delete: jest.fn(() => mockAdminClient),
  eq: jest.fn(() => mockAdminClient),
  order: jest.fn(() => mockAdminClient),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
  auth: {
    admin: {
      createUser: jest.fn(() => ({ data: { user: { id: 'auth-new-id' } }, error: null })),
      updateUserById: jest.fn(() => ({ data: {}, error: null })),
    },
  },
};
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => mockAdminClient) }));

import {
  createAppUser,
  updateAppUser,
  deleteAppUser,
  getAppUsers,
  getAppUser,
} from '@/actions/dashboard/app_user/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'cashier' }, error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
  mockAdminClient.from.mockReturnValue(mockAdminClient);
  mockAdminClient.select.mockReturnValue(mockAdminClient);
  mockAdminClient.insert.mockReturnValue(mockAdminClient);
  mockAdminClient.update.mockReturnValue(mockAdminClient);
  mockAdminClient.delete.mockReturnValue(mockAdminClient);
  mockAdminClient.eq.mockReturnValue(mockAdminClient);
  mockAdminClient.order.mockReturnValue(mockAdminClient);
  mockAdminClient.single.mockReturnValue({ data: { id: '1' }, error: null });
  mockAdminClient.auth.admin.createUser.mockReturnValue({ data: { user: { id: 'auth-new-id' } }, error: null });
  mockAdminClient.auth.admin.updateUserById.mockReturnValue({ data: {}, error: null });
});

const validAppUser = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
};

describe('createAppUser', () => {
  it('should create app user successfully', async () => {
    const result = await createAppUser(validAppUser);
    expect(mockAdminClient.from).toHaveBeenCalledWith('app_user');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: ['email'], message: 'Bad email' }] },
    }));
    const result = await createAppUser({ ...validAppUser, email: 'bad' });
    expect(result.error).toHaveProperty('fieldErrors');
    schema.safeParse = orig;
  });

  it('should enforce plan limit for cashier role', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit reached' });
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(result).toEqual({ data: null, error: { message: 'Limit reached' } });
  });

  it('should not enforce plan limit when role lookup returns non-mapped role', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: 'admin' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should skip plan limit when no role_id', async () => {
    const result = await createAppUser(validAppUser);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return error when no active organization', async () => {
    const { cookies } = require('next/headers');
    cookies.mockReturnValueOnce({ get: jest.fn(() => undefined), set: jest.fn() });
    const result = await createAppUser(validAppUser);
    expect(result.error).toEqual({ message: 'No active organization selected' });
  });

  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }, { path: ['email'], message: 'Bad email' }] },
    }));
    const result = await createAppUser({ ...validAppUser, email: 'bad' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({ email: 'Bad email' });
    schema.safeParse = orig;
  });

  it('should skip plan limit when roleData.name is null', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: null }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should proceed with insert when enforcePlanLimit returns null for collaborator', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: 'collaborator' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    (enforcePlanLimit as jest.Mock).mockReturnValue(null);
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).toHaveBeenCalledWith(123, 'collaborators');
    expect(result.data).toBeDefined();
  });

  it('should create auth user when email and password are provided', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'cashier' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null }); // insert result
    const result = await createAppUser({ ...validAppUser, password: 'secret123', role_id: '5' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'secret123',
      email_confirm: true,
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
        role_name: 'cashier',
      },
    });
    expect(result.data).toBeDefined();
  });

  it('should return error when auth user creation fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'cashier' }, error: null }); // role lookup
    mockAdminClient.auth.admin.createUser.mockReturnValueOnce({
      data: { user: null },
      error: { message: 'Auth error: email already exists' },
    });
    const result = await createAppUser({ ...validAppUser, password: 'secret123', role_id: '5' });
    expect(result).toEqual({ data: null, error: { message: 'Auth error: email already exists' } });
  });

  it('should not create auth user when password is missing', async () => {
    const result = await createAppUser(validAppUser);
    expect(mockAdminClient.auth.admin.createUser).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should handle auth user creation where user id is undefined', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'cashier' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null }); // insert result
    mockAdminClient.auth.admin.createUser.mockReturnValueOnce({
      data: { user: undefined },
      error: null,
    });
    const result = await createAppUser({ ...validAppUser, password: 'secret123', role_id: '5' });
    expect(result.data).toBeDefined();
  });

  it('should create auth user with null first_name/last_name when names are empty', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', name: 'cashier' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null }); // insert result
    const result = await createAppUser({ email: 'noname@example.com', password: 'secret123', role_id: '5', first_name: '', last_name: '' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({
        first_name: null,
        last_name: null,
      }),
    }));
    expect(result.data).toBeDefined();
  });

  it('should handle NaN active_org_id cookie', async () => {
    const { cookies } = require('next/headers');
    cookies.mockReturnValueOnce({ get: jest.fn(() => ({ value: 'not-a-number' })), set: jest.fn() });
    const result = await createAppUser(validAppUser);
    expect(result.error).toEqual({ message: 'No active organization selected' });
  });
});

describe('updateAppUser', () => {
  it('should update app user successfully', async () => {
    const result = await updateAppUser('1', validAppUser);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: ['email'], message: 'Bad email' }] },
    }));
    const result = await updateAppUser('1', { ...validAppUser, email: 'bad' });
    expect(result.error).toHaveProperty('fieldErrors');
    schema.safeParse = orig;
  });

  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateAppUser('1', { ...validAppUser, email: 'bad' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });

  it('should sync password update with existing auth user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'existing-auth-id', email: 'old@example.com', role_id: '5', first_name: 'Old', last_name: 'Name' }, error: null }) // existing user lookup
      .mockReturnValue({ data: { id: '1' }, error: null }); // update result
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith('existing-auth-id', { password: 'newpass123', email: 'john@example.com' });
    expect(result.data).toBeDefined();
  });

  it('should sync email update with existing auth user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'existing-auth-id', email: 'old@example.com', role_id: '5', first_name: 'Old', last_name: 'Name' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { first_name: 'John', last_name: 'Doe', email: 'new@example.com' });
    expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith('existing-auth-id', { email: 'new@example.com' });
    expect(result.data).toBeDefined();
  });

  it('should sync both password and email update with existing auth user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'existing-auth-id', email: 'old@example.com', role_id: '5', first_name: 'Old', last_name: 'Name' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123', email: 'new@example.com' });
    expect(mockAdminClient.auth.admin.updateUserById).toHaveBeenCalledWith('existing-auth-id', { password: 'newpass123', email: 'new@example.com' });
    expect(result.data).toBeDefined();
  });

  it('should return error when auth user update fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'existing-auth-id', email: 'old@example.com', role_id: '5', first_name: 'Old', last_name: 'Name' }, error: null });
    mockAdminClient.auth.admin.updateUserById.mockReturnValueOnce({ data: null, error: { message: 'Auth update failed' } });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(result).toEqual({ data: null, error: { message: 'Auth update failed' } });
  });

  it('should create auth user when no auth_user_id exists and password is provided', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: '5', first_name: 'Existing', last_name: 'User' }, error: null }) // existing user
      .mockReturnValueOnce({ data: { id: '5', name: 'cashier' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null }); // update result
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'newpass123',
      email_confirm: true,
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
        role_name: 'cashier',
      },
    });
    expect(result.data).toBeDefined();
  });

  it('should use existing email when creating auth user without email in updateData', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: '5', first_name: 'Existing', last_name: 'User' }, error: null })
      .mockReturnValueOnce({ data: { id: '5', name: 'cashier' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null });
    // Input with no email, only password
    const result = await updateAppUser('1', { first_name: 'John', last_name: 'Doe', password: 'newpass123' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'existing@example.com',
      password: 'newpass123',
    }));
    expect(result.data).toBeDefined();
  });

  it('should return error when creating auth user on update fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: '5', first_name: 'Existing', last_name: 'User' }, error: null })
      .mockReturnValueOnce({ data: { id: '5', name: 'cashier' }, error: null }); // role lookup
    mockAdminClient.auth.admin.createUser.mockReturnValueOnce({ data: { user: null }, error: { message: 'Create auth failed' } });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(result).toEqual({ data: null, error: { message: 'Create auth failed' } });
  });

  it('should link new auth user id to app_user record', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: '5', first_name: 'Existing', last_name: 'User' }, error: null })
      .mockReturnValueOnce({ data: { id: '5', name: 'cashier' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    mockAdminClient.auth.admin.createUser.mockReturnValueOnce({ data: { user: { id: 'new-auth-id-456' } }, error: null });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(result.data).toBeDefined();
  });

  it('should handle creating auth user without role_id', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: null, first_name: null, last_name: null }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { password: 'newpass123', email: 'new@example.com' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      password: 'newpass123',
      user_metadata: expect.objectContaining({ role_name: null }),
    }));
    expect(result.data).toBeDefined();
  });

  it('should use existing user first/last name as fallback when creating auth user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: null, first_name: 'ExistingFirst', last_name: 'ExistingLast' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    // Input with no first_name, no last_name
    const result = await updateAppUser('1', { password: 'newpass123', email: 'test@example.com' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({
        first_name: 'ExistingFirst',
        last_name: 'ExistingLast',
      }),
    }));
    expect(result.data).toBeDefined();
  });

  it('should handle null first_name/last_name in both updateData and existingUser during auth creation', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: null, first_name: null, last_name: null }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    // Input with empty names (schema transforms to null, then stripped by null filter)
    const result = await updateAppUser('1', { password: 'newpass123', email: 'test@example.com', first_name: '', last_name: '' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({
        first_name: null,
        last_name: null,
      }),
    }));
    expect(result.data).toBeDefined();
  });

  it('should not create or update auth user when only email changes and no auth_user_id', async () => {
    // If only email is changed but no password and no auth_user_id, the "else if" for password won't fire
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'old@example.com', role_id: null, first_name: null, last_name: null }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { ...validAppUser, email: 'new@example.com' });
    expect(mockAdminClient.auth.admin.createUser).not.toHaveBeenCalled();
    expect(mockAdminClient.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should strip null fields from update data (empty strings become null and are stripped)', async () => {
    // Empty string -> schema transforms to null -> null-stripping removes it from updateData
    const result = await updateAppUser('1', { first_name: 'John', last_name: '', email: 'john@example.com', password: '' });
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should handle null roleData in update auth user creation path', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: '5', first_name: 'Old', last_name: 'User' }, error: null })
      .mockReturnValueOnce({ data: null, error: null }) // role lookup returns null data
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({ role_name: null }),
    }));
    expect(result.data).toBeDefined();
  });

  it('should use updateData.role_id when looking up role for auth user creation', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'existing@example.com', role_id: null, first_name: 'Old', last_name: 'User' }, error: null })
      .mockReturnValueOnce({ data: { id: '10', name: 'collaborator' }, error: null }) // role lookup
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await updateAppUser('1', { ...validAppUser, password: 'newpass123', role_id: '10' });
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
      user_metadata: expect.objectContaining({ role_name: 'collaborator' }),
    }));
    expect(result.data).toBeDefined();
  });
});

describe('deleteAppUser', () => {
  it('should delete app user successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteAppUser('1');
    expect(result.error).toBeNull();
  });
});

describe('getAppUsers', () => {
  it('should return app users', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getAppUsers();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getAppUser', () => {
  it('should return single app user', async () => {
    const result = await getAppUser('1');
    expect(result.data).toBeDefined();
  });
});
