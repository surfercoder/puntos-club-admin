jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/address/actions', () => ({
  createAddress: jest.fn(() => ({ data: { id: 1 }, error: null })),
}));
jest.mock('@/actions/dashboard/branch/actions', () => ({
  createBranch: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateBranch: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { branchWithAddressFormAction } from '@/actions/dashboard/branch/branch-with-address-form-actions';
import { createAddress } from '@/actions/dashboard/address/actions';
import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createAddress as jest.Mock).mockReturnValue({ data: { id: 1 }, error: null });
  (createBranch as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateBranch as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const validFields = {
  street: 'Main St',
  number: '100',
  city: 'BA',
  state: 'CABA',
  zip_code: '1000',
  name: 'My Branch',
};

describe('branchWithAddressFormAction', () => {
  it('should create address and branch successfully', async () => {
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAddress).toHaveBeenCalled();
    expect(createBranch).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/branch');
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/address');
    expect(result.status).toBe('success');
    expect(result.message).toContain('created');
  });

  it('should create address and update branch when id provided', async () => {
    const fd = createFormData({ ...validFields, id: '1' });
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(createAddress).toHaveBeenCalled();
    expect(updateBranch).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.message).toContain('updated');
  });

  it('should return validation error for invalid address', async () => {
    const fd = createFormData({ street: '', number: '', city: '', state: '', zip_code: '', name: 'Branch' });
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error when address creation fails', async () => {
    (createAddress as jest.Mock).mockReturnValue({ data: null, error: { message: 'Address error' } });
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error when address error has no message', async () => {
    (createAddress as jest.Mock).mockReturnValue({ data: null, error: {} });
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toContain('Failed to create address');
  });

  it('should return error when branch creation error has no message', async () => {
    (createBranch as jest.Mock).mockReturnValue({ data: null, error: {} });
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toContain('Failed to create branch');
  });

  it('should return error when address returns no id', async () => {
    (createAddress as jest.Mock).mockReturnValue({ data: {}, error: null });
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toContain('no ID returned');
  });

  it('should return error when branch creation fails', async () => {
    (createBranch as jest.Mock).mockReturnValue({ data: null, error: { message: 'Branch error' } });
    const fd = createFormData(validFields);
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return validation error for invalid branch', async () => {
    const fd = createFormData({ ...validFields, name: '' });
    // Address is valid but branch name is empty - depends on BranchSchema behavior
    // Since name is required (min(1)), it should fail
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle latitude and longitude', async () => {
    const fd = createFormData({ ...validFields, latitude: '40.7', longitude: '-73.9' });
    const result = await branchWithAddressFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });
});
