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
  single: jest.fn(() => ({ data: { id: 1, name: 'admin', display_name: 'Administrator' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import { revalidatePath } from 'next/cache';
import {
  getAllUserRoles,
  getUserRoleById,
  updateUserRole,
  getUsersCountByRole,
} from '@/actions/dashboard/user-role/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.not.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({
    data: { id: 1, name: 'admin', display_name: 'Administrator' },
    error: null,
  });
});

describe('getAllUserRoles', () => {
  it('should return user roles', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: 1 }], error: null });
    const result = await getAllUserRoles();
    expect(result).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('should return error on failure', async () => {
    mockSupabase.order.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getAllUserRoles();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getAllUserRoles();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('getUserRoleById', () => {
  it('should return role by id', async () => {
    const result = await getUserRoleById(1);
    expect(result).toEqual({ success: true, data: { id: 1, name: 'admin', display_name: 'Administrator' } });
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Not found' } });
    const result = await getUserRoleById(999);
    expect(result).toEqual({ success: false, error: 'Not found' });
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getUserRoleById(1);
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('updateUserRole', () => {
  it('should update role successfully', async () => {
    const result = await updateUserRole(1, { display_name: 'Super Admin' });
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/user-role');
  });

  it('should only include provided fields', async () => {
    await updateUserRole(1, { description: 'Desc' });
    expect(mockSupabase.update).toHaveBeenCalledWith({ description: 'Desc' });
  });

  it('should return error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await updateUserRole(1, { display_name: 'Test' });
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await updateUserRole(1, { display_name: 'Test' });
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });
});

describe('getUsersCountByRole', () => {
  it('should return counts', async () => {
    mockSupabase.not.mockReturnValue({
      data: [{ role_id: 1 }, { role_id: 1 }, { role_id: 2 }],
      error: null,
    });
    // First select call returns mockSupabase for chaining, second returns count data
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ count: 10, error: null });
    const result = await getUsersCountByRole();
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('appUserCounts');
    expect(result.data).toHaveProperty('beneficiaryCount');
  });

  it('should return error on app_user query failure', async () => {
    mockSupabase.not.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await getUsersCountByRole();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should return error on beneficiary count failure', async () => {
    mockSupabase.not.mockReturnValue({ data: [], error: null });
    // First select call returns mockSupabase for chaining, second returns error
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ count: null, error: { message: 'Error' } });
    const result = await getUsersCountByRole();
    expect(result).toEqual({ success: false, error: 'Error' });
  });

  it('should handle unexpected errors', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const result = await getUsersCountByRole();
    expect(result).toEqual({ success: false, error: 'An unexpected error occurred' });
  });

  it('should handle null role_id in counts', async () => {
    mockSupabase.not.mockReturnValue({
      data: [{ role_id: null }, { role_id: 1 }],
      error: null,
    });
    // First select call returns mockSupabase for chaining, second returns count data
    mockSupabase.select
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ count: 0, error: null });
    const result = await getUsersCountByRole();
    expect(result.success).toBe(true);
  });
});
