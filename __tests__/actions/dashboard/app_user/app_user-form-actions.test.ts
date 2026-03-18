jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/app_user/actions', () => ({
  createAppUser: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateAppUser: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { appUserFormAction } from '@/actions/dashboard/app_user/app_user-form-actions';
import { createAppUser, updateAppUser } from '@/actions/dashboard/app_user/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('appUserFormAction', () => {
  it('should create app user successfully', async () => {
    const fd = createFormData({ organization_id: '10', email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAppUser).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/app_user');
    expect(result.status).toBe('success');
  });

  it('should update app user successfully', async () => {
    const fd = createFormData({ id: '1', organization_id: '10', email: 'test@test.com' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateAppUser).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ organization_id: '' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createAppUser as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ organization_id: '10' });
    const result = await appUserFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
