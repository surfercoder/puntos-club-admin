jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/category/actions', () => ({
  createCategory: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateCategory: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { categoryFormAction } from '@/actions/dashboard/category/category-form-actions';
import { createCategory, updateCategory } from '@/actions/dashboard/category/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createCategory as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateCategory as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('categoryFormAction', () => {
  it('should create category and redirect', async () => {
    const fd = createFormData({ name: 'New Category' });
    await categoryFormAction(EMPTY_ACTION_STATE, fd);
    expect(createCategory).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/category');
    expect(redirect).toHaveBeenCalled();
  });

  it('should update category and redirect', async () => {
    const fd = createFormData({ id: '1', name: 'Updated Category' });
    await categoryFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateCategory).toHaveBeenCalledWith('1', expect.any(Object));
    expect(redirect).toHaveBeenCalled();
  });

  it('should return validation error for invalid data', async () => {
    const fd = createFormData({ name: '' });
    const result = await categoryFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return error from API', async () => {
    (createCategory as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ name: 'Test' });
    const result = await categoryFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
