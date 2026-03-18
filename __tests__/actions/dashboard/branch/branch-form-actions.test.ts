jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/branch/actions', () => ({
  createBranch: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateBranch: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { branchFormAction } from '@/actions/dashboard/branch/branch-form-actions';
import { createBranch, updateBranch } from '@/actions/dashboard/branch/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createBranch as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateBranch as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('branchFormAction', () => {
  it('should create branch successfully', async () => {
    const fd = createFormData({ name: 'Branch', address_id: '10' });
    const result = await branchFormAction(EMPTY_ACTION_STATE, fd);
    expect(createBranch).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/branch');
    expect(result.status).toBe('success');
  });

  it('should update branch successfully', async () => {
    const fd = createFormData({ id: '1', name: 'Branch', address_id: '10' });
    const result = await branchFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateBranch).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ name: '', address_id: '' });
    const result = await branchFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle API error', async () => {
    (createBranch as jest.Mock).mockImplementation(() => { throw new Error('API error'); });
    const fd = createFormData({ name: 'Branch', address_id: '10' });
    const result = await branchFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
    expect(result.message).toBe('API error');
  });
});
