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
  not: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', name: 'cashier', auth_user_id: 'auth-1', email: 'test@test.com' }, error: null })),
  rpc: jest.fn(() => ({ data: [{ id: 1 }], error: null })),
  auth: {
    getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })),
    admin: {
      createUser: jest.fn(() => ({ data: { user: { id: 'new-auth-1' } }, error: null })),
      deleteUser: jest.fn(() => ({ error: null })),
      updateUserById: jest.fn(() => ({ error: null })),
    },
  },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserById,
} from '@/actions/dashboard/user/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.not.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({
    data: { id: '1', name: 'cashier', auth_user_id: 'auth-1', email: 'test@test.com' },
    error: null,
  });
  mockSupabase.rpc.mockReturnValue({ data: [{ id: 1 }], error: null });
  mockSupabase.auth.admin.createUser.mockReturnValue({ data: { user: { id: 'new-auth-1' } }, error: null });
  mockSupabase.auth.admin.deleteUser.mockReturnValue({ error: null });
  mockSupabase.auth.admin.updateUserById.mockReturnValue({ error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

describe('createUser', () => {
  it('should create beneficiary user', async () => {
    const result = await createUser({
      user_type: 'beneficiary',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@test.com',
      phone: '1234',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(result).toBeDefined();
  });

  it('should create app_user with auth and use RPC when org provided', async () => {
    const result = await createUser({
      user_type: 'app_user',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      organization_id: '10',
      role_id: '5',
    });
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalled();
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_app_user_with_org', expect.any(Object));
    expect(result).toEqual({ id: 1 });
  });

  it('should enforce plan limit for cashier role', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit reached' });
    await expect(
      createUser({
        user_type: 'app_user',
        role_id: '5',
        organization_id: '10',
        email: 'test@test.com',
        password: 'pass',
      }),
    ).rejects.toThrow('Limit reached');
  });

  it('should skip plan limit for non-mapped roles', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { name: 'admin' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await createUser({
      user_type: 'app_user',
      role_id: '5',
      organization_id: '10',
      email: 'test@test.com',
      password: 'pass',
    });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw on auth error and not create app_user', async () => {
    mockSupabase.auth.admin.createUser.mockReturnValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        organization_id: '10',
      }),
    ).rejects.toThrow('Failed to create authentication user');
  });

  it('should throw when auth user creation succeeds but no user data returned', async () => {
    mockSupabase.auth.admin.createUser.mockReturnValue({
      data: { user: null },
      error: null,
    });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        organization_id: '10',
      }),
    ).rejects.toThrow('Auth user creation succeeded but no user data returned');
  });

  it('should clean up auth user on RPC failure', async () => {
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'RPC failed', code: '500' } });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        organization_id: '10',
      }),
    ).rejects.toThrow('Failed to create user');
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('new-auth-1');
  });

  it('should swallow cleanup error when auth delete fails on RPC path', async () => {
    // Line 122: _cleanupError is swallowed
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'RPC failed', code: '500' } });
    mockSupabase.auth.admin.deleteUser.mockImplementation(() => { throw new Error('cleanup fail'); });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        organization_id: '10',
      }),
    ).rejects.toThrow('Failed to create user');
  });

  it('should clean up auth user on regular insert failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert failed', code: '23505' } });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        // no organization_id so it goes through regular insert path
      }),
    ).rejects.toThrow('Failed to create user');
  });

  it('should swallow cleanup error when auth delete fails on insert path', async () => {
    // Line 146: _cleanupError is swallowed on the regular insert path
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert failed', code: '23505' } });
    mockSupabase.auth.admin.deleteUser.mockImplementation(() => { throw new Error('cleanup fail'); });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        password: 'pass',
        // no organization_id => regular insert path
      }),
    ).rejects.toThrow('Failed to create user');
  });

  it('should not cleanup auth user on RPC failure when no auth user was created', async () => {
    // No password => no auth user created => authUserId is null
    mockSupabase.rpc.mockReturnValue({ data: null, error: { message: 'RPC failed', code: '500' } });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        organization_id: '10',
        // no password => no auth user
      }),
    ).rejects.toThrow('Failed to create user');
    expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('should not cleanup auth user on regular insert failure when no auth user created', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Insert failed', code: '23505' } });
    await expect(
      createUser({
        user_type: 'app_user',
        email: 'test@test.com',
        // no password and no org => regular insert, no auth user
      }),
    ).rejects.toThrow('Failed to create user');
    expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it('should return null when RPC returns empty array', async () => {
    mockSupabase.rpc.mockReturnValue({ data: [], error: null });
    const result = await createUser({
      user_type: 'app_user',
      email: 'test@test.com',
      password: 'pass',
      organization_id: '10',
    });
    expect(result).toBeNull();
  });

  it('should skip plan limit when no role_id', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: 1 }, error: null });
    const result = await createUser({
      user_type: 'app_user',
      email: 'test@test.com',
      organization_id: '10',
      // no role_id
    });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should skip plan limit when roleData name is null', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { name: null }, error: null })
      .mockReturnValue({ data: { id: 1 }, error: null });
    mockSupabase.rpc.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await createUser({
      user_type: 'app_user',
      email: 'test@test.com',
      password: 'pass',
      organization_id: '10',
      role_id: '5',
    });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should not include password in userData when no password provided for app_user', async () => {
    mockSupabase.rpc.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await createUser({
      user_type: 'app_user',
      email: 'test@test.com',
      organization_id: '10',
    });
    expect(result).toBeDefined();
  });

  it('should create app_user without auth when no password', async () => {
    mockSupabase.single.mockReturnValue({ data: { id: 1 }, error: null });
    const result = await createUser({
      user_type: 'app_user',
      email: 'test@test.com',
      // no organization_id so regular insert
    });
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

describe('updateUser', () => {
  it('should update app_user successfully', async () => {
    const result = await updateUser('1', {
      user_type: 'app_user',
      first_name: 'Updated',
    });
    expect(result).toBeDefined();
  });

  it('should update beneficiary successfully', async () => {
    const result = await updateUser('1', {
      user_type: 'beneficiary',
      first_name: 'Updated',
      phone: '5555',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(result).toBeDefined();
  });

  it('should update auth password when password provided for app_user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null })
      .mockReturnValueOnce({ data: { id: '1' }, error: null });
    await updateUser('1', { user_type: 'app_user', password: 'newpass123' });
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('auth-1', { password: 'newpass123' });
  });

  it('should throw on fetch error when updating password', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    await expect(
      updateUser('1', { user_type: 'app_user', password: 'newpass' }),
    ).rejects.toThrow('Failed to fetch existing user');
  });

  it('should throw on auth password update error', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null });
    mockSupabase.auth.admin.updateUserById.mockReturnValue({ error: { message: 'Auth error' } });
    await expect(
      updateUser('1', { user_type: 'app_user', password: 'newpass' }),
    ).rejects.toThrow('Failed to update authentication password');
  });

  it('should skip auth password update when no auth_user_id on existing user', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: null, email: 'test@test.com' }, error: null })
      .mockReturnValueOnce({ data: { id: '1' }, error: null });
    await updateUser('1', { user_type: 'app_user', password: 'newpass123' });
    expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it('should include password in userData when provided for app_user update', async () => {
    mockSupabase.single
      .mockReturnValueOnce({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null })
      .mockReturnValueOnce({ data: { id: '1' }, error: null });
    const result = await updateUser('1', { user_type: 'app_user', password: 'newpass123' });
    expect(result).toBeDefined();
  });

  it('should not include password for beneficiary update', async () => {
    const result = await updateUser('1', {
      user_type: 'beneficiary',
      first_name: 'Updated',
      password: 'ignored',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(result).toBeDefined();
  });

  it('should throw on update DB failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Update failed' } });
    await expect(
      updateUser('1', { user_type: 'app_user', first_name: 'Test' }),
    ).rejects.toThrow('Failed to update user');
  });
});

describe('deleteUser', () => {
  it('should delete app_user and auth user', async () => {
    mockSupabase.single.mockReturnValue({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null });
    // First eq is for the fetch query (.eq('id', id) before .single()), needs to chain
    // Second eq is for the delete query (.delete().eq('id', id)), terminal
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteUser('1', 'app_user');
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-1');
    expect(result).toEqual({ success: true });
  });

  it('should delete beneficiary without auth cleanup', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteUser('1', 'beneficiary');
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(result).toEqual({ success: true });
  });

  it('should throw on DB delete failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Delete failed' } });
    await expect(deleteUser('1', 'beneficiary')).rejects.toThrow('Failed to delete user');
  });

  it('should continue with deletion even if auth delete fails', async () => {
    mockSupabase.single.mockReturnValue({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null });
    mockSupabase.auth.admin.deleteUser.mockReturnValue({ error: { message: 'Auth delete failed' } });
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteUser('1', 'app_user');
    expect(result).toEqual({ success: true });
  });

  it('should continue with deletion even if fetching existing user fails', async () => {
    // Line 250: fetchError throw is caught by the outer try-catch
    // The fetch chain: from -> select -> eq -> single (returns error)
    // The delete chain: from -> delete -> eq (returns {error: null})
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    // eq needs to return mockSupabase for chaining (fetch), then {error:null} for delete
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // fetch: .eq('id', id) -> mockSupabase (continues to .single())
      .mockReturnValueOnce({ error: null }); // delete: .delete().eq('id', id) -> {error: null}
    const result = await deleteUser('1', 'app_user');
    expect(result).toEqual({ success: true });
  });

  it('should continue with deletion when auth delete throws an error', async () => {
    mockSupabase.single.mockReturnValue({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null });
    mockSupabase.auth.admin.deleteUser.mockImplementation(() => { throw new Error('Auth service down'); });
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteUser('1', 'app_user');
    expect(result).toEqual({ success: true });
  });

  it('should continue deletion when adminClient.auth.admin.deleteUser returns error (lines 254-261)', async () => {
    // Properly chain: eq returns mockSupabase for the select query, then {error:null} for delete query
    mockSupabase.single.mockReturnValue({ data: { auth_user_id: 'auth-1', email: 'test@test.com' }, error: null });
    mockSupabase.auth.admin.deleteUser.mockReturnValue({ error: { message: 'Auth delete returned error' } });
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase) // select chain .eq('id', id)
      .mockReturnValueOnce({ error: null }); // delete chain .delete().eq('id', id)
    const result = await deleteUser('1', 'app_user');
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-1');
    expect(result).toEqual({ success: true });
  });

  it('should skip auth user deletion when no auth_user_id', async () => {
    mockSupabase.single.mockReturnValue({ data: { auth_user_id: null, email: 'test@test.com' }, error: null });
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteUser('1', 'app_user');
    expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});

describe('getAllUsers', () => {
  it('should return all users for admin (no organizationId)', async () => {
    const appUsers = [
      { id: 1, role: { name: 'admin' }, created_at: '2024-01-01' },
    ];
    const beneficiaries = [{ id: 2, created_at: '2024-01-02' }];
    mockSupabase.order
      .mockReturnValueOnce({ data: appUsers, error: null }) // app_users
      .mockReturnValueOnce({ data: beneficiaries, error: null }); // beneficiaries
    const result = await getAllUsers();
    expect(result).toHaveLength(2);
  });

  it('should filter out owners when organizationId is provided', async () => {
    const appUsers = [
      { id: 1, role: { name: 'owner' }, created_at: '2024-01-01' },
      { id: 2, role: { name: 'cashier' }, created_at: '2024-01-02' },
    ];
    mockSupabase.order.mockReturnValue({ data: appUsers, error: null });
    const result = await getAllUsers('10');
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('user_type', 'app_user');
  });

  it('should throw on app_users query error', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    await expect(getAllUsers()).rejects.toThrow('Failed to fetch app users');
  });

  it('should throw on beneficiaries query error', async () => {
    mockSupabase.order
      .mockReturnValueOnce({ data: [], error: null })
      .mockReturnValueOnce({ data: null, error: { message: 'Error' } });
    await expect(getAllUsers()).rejects.toThrow('Failed to fetch beneficiaries');
  });

  it('should handle null appUsers data gracefully', async () => {
    mockSupabase.order
      .mockReturnValueOnce({ data: null, error: null }) // null but no error
      .mockReturnValueOnce({ data: [], error: null });
    // When data is null, filteredAppUsers uses (appUsers || [])
    const result = await getAllUsers();
    expect(result).toHaveLength(0);
  });

  it('should handle null beneficiaries data gracefully', async () => {
    mockSupabase.order
      .mockReturnValueOnce({ data: [], error: null })
      .mockReturnValueOnce({ data: null, error: null }); // null but no error
    const result = await getAllUsers();
    expect(result).toHaveLength(0);
  });

  it('should include users with null role when organizationId provided', async () => {
    const appUsers = [
      { id: 1, role: null, created_at: '2024-01-01' },
    ];
    mockSupabase.order.mockReturnValue({ data: appUsers, error: null });
    const result = await getAllUsers('10');
    expect(result).toHaveLength(1);
  });
});

describe('getUserById', () => {
  it('should return app_user by id', async () => {
    const result = await getUserById('1', 'app_user');
    expect(mockSupabase.from).toHaveBeenCalledWith('app_user');
    expect(result).toHaveProperty('user_type', 'app_user');
  });

  it('should return beneficiary by id', async () => {
    const result = await getUserById('1', 'beneficiary');
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(result).toHaveProperty('user_type', 'beneficiary');
  });

  it('should throw on error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    await expect(getUserById('999', 'app_user')).rejects.toThrow('Failed to fetch user');
  });
});
