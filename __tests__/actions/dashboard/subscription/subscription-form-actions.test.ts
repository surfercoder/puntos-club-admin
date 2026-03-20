jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/subscription/actions', () => ({
  createSubscription: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateSubscription: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { subscriptionFormAction } from '@/actions/dashboard/subscription/subscription-form-actions';
import { createSubscription, updateSubscription } from '@/actions/dashboard/subscription/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createSubscription as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateSubscription as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('subscriptionFormAction', () => {
  it('should create subscription and redirect', async () => {
    const fd = createFormData({ organization_id: 'org-1', mp_preapproval_id: 'pre-1', mp_plan_id: 'plan-1', plan: 'advance', status: 'pending', payer_email: 'test@test.com', amount: '100', currency: 'ARS' });
    await subscriptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(createSubscription).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/subscription');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update subscription and redirect', async () => {
    const fd = createFormData({ id: '1', organization_id: 'org-1', mp_preapproval_id: 'pre-1', mp_plan_id: 'plan-1', plan: 'advance', status: 'pending', payer_email: 'test@test.com', amount: '100', currency: 'ARS' });
    await subscriptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateSubscription).toHaveBeenCalledWith('1', expect.any(Object));
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ organization_id: '', mp_preapproval_id: 'pre-1', mp_plan_id: 'plan-1', plan: 'advance', payer_email: 'test@test.com', amount: '100' });
    const result = await subscriptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (createSubscription as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ organization_id: 'org-1', mp_preapproval_id: 'pre-1', mp_plan_id: 'plan-1', plan: 'advance', status: 'pending', payer_email: 'test@test.com', amount: '100', currency: 'ARS' });
    const result = await subscriptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle unexpected thrown error', async () => {
    (createSubscription as jest.Mock).mockImplementation(() => { throw new Error('Unexpected'); });
    const fd = createFormData({ organization_id: 'org-1', mp_preapproval_id: 'pre-1', mp_plan_id: 'plan-1', plan: 'advance', status: 'pending', payer_email: 'test@test.com', amount: '100', currency: 'ARS' });
    await expect(subscriptionFormAction(EMPTY_ACTION_STATE, fd)).rejects.toThrow('Unexpected');
  });
});
