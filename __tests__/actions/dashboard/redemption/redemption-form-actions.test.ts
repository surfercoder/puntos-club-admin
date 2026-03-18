jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/redemption/actions', () => ({
  createRedemption: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateRedemption: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { redemptionFormAction } from '@/actions/dashboard/redemption/redemption-form-actions';
import { createRedemption, updateRedemption } from '@/actions/dashboard/redemption/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('redemptionFormAction', () => {
  it('should create redemption successfully', async () => {
    const fd = createFormData({ beneficiary_id: '1', order_id: '3', points_used: '100', quantity: '1' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(createRedemption).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
    expect(result.status).toBe('success');
  });

  it('should update redemption successfully', async () => {
    const fd = createFormData({ id: '1', beneficiary_id: '1', order_id: '3', points_used: '100', quantity: '1' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateRedemption).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ beneficiary_id: '', order_id: '' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createRedemption as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ beneficiary_id: '1', order_id: '3', points_used: '100', quantity: '1' });
    const result = await redemptionFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
