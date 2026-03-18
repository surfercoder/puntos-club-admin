jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/app_user_organization/actions', () => ({
  createAppUserOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateAppUserOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { appUserOrganizationFormAction } from '@/actions/dashboard/app_user_organization/app_user_organization-form-actions';
import { createAppUserOrganization, updateAppUserOrganization } from '@/actions/dashboard/app_user_organization/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('appUserOrganizationFormAction', () => {
  it('should create successfully', async () => {
    const fd = createFormData({ app_user_id: '10', organization_id: '20' });
    const result = await appUserOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAppUserOrganization).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/app_user_organization');
    expect(result.status).toBe('success');
  });

  it('should update successfully', async () => {
    const fd = createFormData({ id: '1', app_user_id: '10', organization_id: '20' });
    const result = await appUserOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateAppUserOrganization).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ app_user_id: '', organization_id: '' });
    const result = await appUserOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createAppUserOrganization as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ app_user_id: '10', organization_id: '20' });
    const result = await appUserOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
