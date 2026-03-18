jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/address/actions', () => ({
  createAddress: jest.fn(() => ({ data: { id: 1 }, error: null })),
  updateAddress: jest.fn(() => ({ data: { id: 1 }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { addressFormAction } from '@/actions/dashboard/address/address-form-actions';
import { createAddress, updateAddress } from '@/actions/dashboard/address/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('addressFormAction', () => {
  const validFields = { street: 'Main', number: '100', city: 'BA', state: 'CABA', zip_code: '1000' };

  it('should create address successfully', async () => {
    const fd = createFormData(validFields);
    const result = await addressFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAddress).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/address');
    expect(result.status).toBe('success');
  });

  it('should update address successfully', async () => {
    const fd = createFormData({ ...validFields, id: '1' });
    const result = await addressFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateAddress).toHaveBeenCalledWith(1, expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ street: '' });
    const result = await addressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createAddress as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData(validFields);
    const result = await addressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
