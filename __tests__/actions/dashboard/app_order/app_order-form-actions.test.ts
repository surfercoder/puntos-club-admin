jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/app_order/actions', () => ({
  createAppOrder: jest.fn(() => ({ data: { id: '1' } })),
  updateAppOrder: jest.fn(() => ({ data: { id: '1' } })),
}));

import { revalidatePath } from 'next/cache';
import { appOrderFormAction } from '@/actions/dashboard/app_order/app_order-form-actions';
import { createAppOrder, updateAppOrder } from '@/actions/dashboard/app_order/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('appOrderFormAction', () => {
  it('should create order successfully', async () => {
    const fd = createFormData({ order_number: 'ORD-001', total_points: '100' });
    const result = await appOrderFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAppOrder).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/app_order');
    expect(result.status).toBe('success');
  });

  it('should update order successfully', async () => {
    const fd = createFormData({ id: '1', order_number: 'ORD-001', total_points: '100' });
    const result = await appOrderFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateAppOrder).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ order_number: '' });
    const result = await appOrderFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createAppOrder as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ order_number: 'ORD-001', total_points: '100' });
    const result = await appOrderFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
