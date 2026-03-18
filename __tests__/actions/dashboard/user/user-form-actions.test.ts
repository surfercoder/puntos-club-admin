jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { name: 'admin' }, error: null })),
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

jest.mock('@/actions/dashboard/user/actions', () => ({
  createUser: jest.fn(() => ({ id: '1' })),
  updateUser: jest.fn(() => ({ id: '1' })),
}));

jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import { revalidatePath } from 'next/cache';
import { userFormAction } from '@/actions/dashboard/user/user-form-actions';
import { createUser, updateUser } from '@/actions/dashboard/user/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { name: 'cashier' }, error: null });
  (createUser as jest.Mock).mockReturnValue({ id: '1' });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const validFields = {
  organization_id: '10',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@test.com',
  password: 'password123',
  role_id: '5',
  user_type: 'app_user',
  active: 'true',
};

describe('userFormAction', () => {
  it('should create user successfully', async () => {
    const fd = createFormData(validFields);
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(createUser).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/users');
    expect(result.status).toBe('success');
  });

  it('should update user successfully', async () => {
    const fd = createFormData({ ...validFields, id: '1' });
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateUser).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error for missing fields', async () => {
    const fd = createFormData({ organization_id: '', first_name: '' });
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should enforce plan limit for cashier on create', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ status: 'error', message: 'Limit reached', fieldErrors: {} });
    const fd = createFormData(validFields);
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.message).toBe('Limit reached');
  });

  it('should not enforce plan limit for non-mapped roles', async () => {
    mockSupabase.single.mockReturnValue({ data: { name: 'admin' }, error: null });
    const fd = createFormData(validFields);
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should skip plan limit when role lookup returns null', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: null });
    const fd = createFormData(validFields);
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should skip plan limit on update even with role_id and org_id', async () => {
    const fd = createFormData({ ...validFields, id: '1' });
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should handle thrown error', async () => {
    (createUser as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData(validFields);
    const result = await userFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
