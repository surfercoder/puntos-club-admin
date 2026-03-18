jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/product/actions', () => ({
  createProduct: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateProduct: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { productFormAction } from '@/actions/dashboard/product/product-form-actions';
import { createProduct, updateProduct } from '@/actions/dashboard/product/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createProduct as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateProduct as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('productFormAction', () => {
  it('should create product successfully', async () => {
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(createProduct).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/product');
    expect(result.status).toBe('success');
  });

  it('should update product successfully', async () => {
    const fd = createFormData({ id: '1', name: 'Product', category_id: '5', required_points: '100' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateProduct).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should parse image_urls from JSON string', async () => {
    const fd = createFormData({
      name: 'Product',
      category_id: '5',
      required_points: '100',
      image_urls: '["url1","url2"]',
    });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });

  it('should handle invalid JSON image_urls', async () => {
    const fd = createFormData({
      name: 'Product',
      category_id: '5',
      required_points: '100',
      image_urls: 'not-json',
    });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ name: '', category_id: '' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle API error result', async () => {
    (createProduct as jest.Mock).mockReturnValue({ error: new Error('API error') });
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createProduct as jest.Mock).mockImplementation(() => { throw new Error('Throw'); });
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
