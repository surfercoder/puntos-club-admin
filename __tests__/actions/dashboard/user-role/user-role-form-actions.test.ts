jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ error: null })),
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { userRoleFormAction } from '@/actions/dashboard/user-role/user-role-form-actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('userRoleFormAction', () => {
  it('should create user role and redirect', async () => {
    const fd = createFormData({ name: 'admin', display_name: 'Administrator' });
    await userRoleFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_role');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/user-role');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update user role and redirect', async () => {
    const fd = createFormData({ id: '1', name: 'admin', display_name: 'Administrator' });
    await userRoleFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_role');
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '1');
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ name: 'invalid_role', display_name: 'Test' });
    const result = await userRoleFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from supabase', async () => {
    mockSupabase.single.mockReturnValue({ error: new Error('Supabase error') });
    const fd = createFormData({ name: 'admin', display_name: 'Administrator' });
    const result = await userRoleFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from supabase on update', async () => {
    mockSupabase.single.mockReturnValue({ error: new Error('Update DB error') });
    const fd = createFormData({ id: '1', name: 'admin', display_name: 'Administrator' });
    const result = await userRoleFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(mockSupabase.update).toHaveBeenCalled();
  });

  it('should handle unexpected thrown error', async () => {
    mockSupabase.from.mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ name: 'admin', display_name: 'Administrator' });
    await expect(userRoleFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
