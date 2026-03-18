jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/stock/actions', () => ({
  createStock: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateStock: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { stockFormAction } from '@/actions/dashboard/stock/stock-form-actions';
import { createStock, updateStock } from '@/actions/dashboard/stock/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('stockFormAction', () => {
  it('should create stock successfully', async () => {
    const fd = createFormData({ branch_id: '10', product_id: '20', quantity: '50', minimum_quantity: '5' });
    const result = await stockFormAction(EMPTY_ACTION_STATE, fd);
    expect(createStock).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/stock');
    expect(result.status).toBe('success');
  });

  it('should update stock successfully', async () => {
    const fd = createFormData({ id: '1', branch_id: '10', product_id: '20', quantity: '50', minimum_quantity: '5' });
    const result = await stockFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateStock).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ branch_id: '', product_id: '' });
    const result = await stockFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createStock as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ branch_id: '10', product_id: '20', quantity: '50', minimum_quantity: '5' });
    const result = await stockFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
