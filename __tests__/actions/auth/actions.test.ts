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
  single: jest.fn(() => ({ data: { id: '1', auth_user_id: 'auth-1', email: 'test@test.com', role: { name: 'admin' } }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'auth-1', email: 'test@test.com' } },
      error: null,
    })),
    signInWithPassword: jest.fn(() => ({ error: null })),
    signOut: jest.fn(() => ({ error: null })),
    admin: {
      createUser: jest.fn(() => ({ data: { user: { id: 'new-1' } }, error: null })),
      deleteUser: jest.fn(() => ({ error: null })),
    },
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => mockSupabase) }));

import {
  checkAdminPortalAccess,
  signInAdminPortal,
  signUpAdmin,
} from '@/actions/auth/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({
    data: { id: '1', auth_user_id: 'auth-1', email: 'test@test.com', role: { name: 'admin' } },
    error: null,
  });
  mockSupabase.auth.getUser.mockReturnValue({
    data: { user: { id: 'auth-1', email: 'test@test.com' } },
    error: null,
  });
  mockSupabase.auth.signInWithPassword.mockReturnValue({ error: null });
  mockSupabase.auth.signOut.mockReturnValue({ error: null });
  mockSupabase.auth.admin.createUser.mockReturnValue({ data: { user: { id: 'new-1' } }, error: null });
  mockSupabase.auth.admin.deleteUser.mockReturnValue({ error: null });
});

describe('checkAdminPortalAccess', () => {
  it('should return allowed for admin user found by auth_user_id', async () => {
    const result = await checkAdminPortalAccess();
    expect(result).toEqual({ allowed: true, role: 'admin', error: null });
  });

  it('should return not allowed when no authenticated user', async () => {
    mockSupabase.auth.getUser.mockReturnValue({ data: { user: null }, error: { message: 'No session' } });
    const result = await checkAdminPortalAccess();
    expect(result).toEqual({ allowed: false, role: null, error: 'No authenticated user' });
  });

  it('should fallback to email lookup when auth_user_id not found', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } }) // auth_user_id lookup
      .mockReturnValueOnce({ data: { id: '2', auth_user_id: null, email: 'test@test.com', role: { name: 'owner' } }, error: null }); // email lookup
    const result = await checkAdminPortalAccess();
    expect(result).toEqual({ allowed: true, role: 'owner', error: null });
    // Should update auth_user_id
    expect(mockSupabase.update).toHaveBeenCalledWith({ auth_user_id: 'auth-1' });
  });

  it('should sign out and deny access when no app_user found', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } })
      .mockReturnValueOnce({ data: null, error: { message: 'Not found' } });
    const result = await checkAdminPortalAccess();
    expect(result.allowed).toBe(false);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should deny access for disallowed roles', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', role: { name: 'cashier' } },
      error: null,
    });
    const result = await checkAdminPortalAccess();
    expect(result.allowed).toBe(false);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should deny access when role is null', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', role: null },
      error: null,
    });
    const result = await checkAdminPortalAccess();
    expect(result.allowed).toBe(false);
  });

  it('should allow collaborator role', async () => {
    mockSupabase.single.mockReturnValue({
      data: { id: '1', auth_user_id: 'auth-1', role: { name: 'collaborator' } },
      error: null,
    });
    const result = await checkAdminPortalAccess();
    expect(result).toEqual({ allowed: true, role: 'collaborator', error: null });
  });

  it('should skip email fallback when user has no email', async () => {
    mockSupabase.auth.getUser.mockReturnValue({
      data: { user: { id: 'auth-1', email: undefined } },
      error: null,
    });
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await checkAdminPortalAccess();
    expect(result.allowed).toBe(false);
  });
});

describe('signInAdminPortal', () => {
  it('should sign in successfully', async () => {
    const result = await signInAdminPortal('admin@test.com', 'password');
    expect(result.success).toBe(true);
    expect(result.role).toBe('admin');
  });

  it('should return error on sign in failure', async () => {
    mockSupabase.auth.signInWithPassword.mockReturnValue({ error: { message: 'Invalid credentials' } });
    const result = await signInAdminPortal('bad@test.com', 'wrong');
    expect(result).toEqual({ success: false, role: null, error: 'Invalid credentials' });
  });

  it('should return error when access check fails', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { id: '1', role: { name: 'cashier' } }, error: null });
    const result = await signInAdminPortal('cashier@test.com', 'password');
    expect(result.success).toBe(false);
  });
});

describe('signUpAdmin', () => {
  it('should sign up admin successfully', async () => {
    const result = await signUpAdmin({
      email: 'new@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'Admin',
    });
    expect(result).toEqual({ success: true, error: null });
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalled();
  });

  it('should return error on auth user creation failure', async () => {
    mockSupabase.auth.admin.createUser.mockReturnValue({
      data: { user: null },
      error: { message: 'Email taken' },
    });
    const result = await signUpAdmin({ email: 'dup@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'Email taken' });
  });

  it('should return error when auth user created but no user data', async () => {
    mockSupabase.auth.admin.createUser.mockReturnValue({
      data: { user: null },
      error: null,
    });
    const result = await signUpAdmin({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'Failed to create auth user' });
  });

  it('should cleanup and return error when role lookup fails', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'No role' } });
    const result = await signUpAdmin({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'Failed to get admin role' });
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('new-1');
  });

  it('should cleanup and return error when app_user insert fails', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: 1 }, error: null }); // role lookup
    mockSupabase.insert.mockReturnValue({ error: { message: 'Insert failed' } });
    const result = await signUpAdmin({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'Failed to create user profile' });
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.auth.admin.createUser.mockImplementation(() => {
      throw new Error('Unexpected');
    });
    const result = await signUpAdmin({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'Unexpected' });
  });

  it('should handle non-Error throws', async () => {
    mockSupabase.auth.admin.createUser.mockImplementation(() => {
      throw 'string error';
    });
    const result = await signUpAdmin({ email: 'test@test.com', password: 'pass' });
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});
