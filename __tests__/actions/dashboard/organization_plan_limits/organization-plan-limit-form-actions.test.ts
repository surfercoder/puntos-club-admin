jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/organization_plan_limits/actions', () => ({
  createOrganizationPlanLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateOrganizationPlanLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { organizationPlanLimitFormAction } from '@/actions/dashboard/organization_plan_limits/organization-plan-limit-form-actions';
import { createOrganizationPlanLimit, updateOrganizationPlanLimit } from '@/actions/dashboard/organization_plan_limits/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createOrganizationPlanLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateOrganizationPlanLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('organizationPlanLimitFormAction', () => {
  it('should create organization plan limit and redirect', async () => {
    const fd = createFormData({ organization_id: 'org-1', plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await organizationPlanLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(createOrganizationPlanLimit).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/organization_plan_limits');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update organization plan limit and redirect', async () => {
    const fd = createFormData({ id: '1', organization_id: 'org-1', plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await organizationPlanLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateOrganizationPlanLimit).toHaveBeenCalledWith('1', expect.any(Object));
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ organization_id: '', plan: 'trial', feature: 'beneficiaries', limit_value: '100' });
    const result = await organizationPlanLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (createOrganizationPlanLimit as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ organization_id: 'org-1', plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    const result = await organizationPlanLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    (createOrganizationPlanLimit as jest.Mock).mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ organization_id: 'org-1', plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await expect(organizationPlanLimitFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
