jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/plan_limits/actions', () => ({
  createPlanLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updatePlanLimit: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { planLimitFormAction } from '@/actions/dashboard/plan_limits/plan-limit-form-actions';
import { createPlanLimit, updatePlanLimit } from '@/actions/dashboard/plan_limits/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createPlanLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updatePlanLimit as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('planLimitFormAction', () => {
  it('should create plan limit and redirect', async () => {
    const fd = createFormData({ plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await planLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(createPlanLimit).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/plan_limits');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update plan limit and redirect', async () => {
    const fd = createFormData({ id: '1', plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await planLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(updatePlanLimit).toHaveBeenCalledWith('1', expect.any(Object));
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ plan: '', feature: 'beneficiaries', limit_value: '100' });
    const result = await planLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (createPlanLimit as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    const result = await planLimitFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    (createPlanLimit as jest.Mock).mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ plan: 'trial', feature: 'beneficiaries', limit_value: '100', warning_threshold: '0.8' });
    await expect(planLimitFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
