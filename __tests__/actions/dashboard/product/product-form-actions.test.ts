jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/product/actions', () => ({
  createProduct: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateProduct: jest.fn(() => ({ data: { id: '1' }, error: null })),
  createCategory: jest.fn(() => ({ data: { id: '9' }, error: null, created: true })),
  deleteCategory: jest.fn(() => ({ error: null })),
}));

import { revalidatePath } from 'next/cache';
import { productFormAction } from '@/actions/dashboard/product/product-form-actions';
import { createCategory, createProduct, deleteCategory, updateProduct } from '@/actions/dashboard/product/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  (createProduct as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (updateProduct as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (createCategory as jest.Mock).mockReturnValue({ data: { id: '9' }, error: null, created: true });
  (deleteCategory as jest.Mock).mockReturnValue({ error: null });
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('productFormAction', () => {
  it('should create product successfully', async () => {
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100', stock: '10' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(createProduct).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/product');
    expect(result.status).toBe('success');
  });

  it('should update product successfully', async () => {
    const fd = createFormData({ id: '1', name: 'Product', category_id: '5', required_points: '100', stock: '10' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateProduct).toHaveBeenCalledWith('1', expect.objectContaining({ stock: 10 }));
    expect(result.status).toBe('success');
  });

  it('omits stock from the update when the admin did not change it', async () => {
    const fd = createFormData({
      id: '1', name: 'Product', category_id: '5', required_points: '100',
      stock: '10', stock_loaded: '10',
    });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    // Keeping stock out of the payload is what stops a concurrent redemption
    // from being reverted by a stale absolute write.
    expect(updateProduct).toHaveBeenCalledWith('1', expect.not.objectContaining({ stock: expect.anything() }));
    expect(result.status).toBe('success');
  });

  it('should parse image_urls from JSON string', async () => {
    const fd = createFormData({
      name: 'Product',
      category_id: '5',
      required_points: '100', stock: '10',
      image_urls: '["url1","url2"]',
    });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('success');
  });

  it('should handle invalid JSON image_urls', async () => {
    const fd = createFormData({
      name: 'Product',
      category_id: '5',
      required_points: '100', stock: '10',
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
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100', stock: '10' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createProduct as jest.Mock).mockImplementation(() => { throw new Error('Throw'); });
    const fd = createFormData({ name: 'Product', category_id: '5', required_points: '100', stock: '10' });
    const result = await productFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});

describe('productFormAction inline category', () => {
  function formDataOf(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.append(k, v);
    return fd;
  }

  it('creates the typed category and saves the product against it', async () => {
    await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({
        new_category: '  Bebidas  ',
        category_id: '',
        name: 'Café',
        required_points: '100',
        stock: '10',
      }),
    );

    expect(createCategory).toHaveBeenCalledWith({ name: 'Bebidas', active: true });
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: '9' }),
    );
  });

  it('surfaces an error from the category creation instead of saving the product', async () => {
    (createCategory as jest.Mock).mockReturnValueOnce({ data: null, error: { message: 'nope' } });

    const result = await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ new_category: 'Bebidas', name: 'Café', required_points: '1', stock: '1' }),
    );

    expect(result.status).toBe('error');
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('ignores a blank new category and keeps the selected one', async () => {
    await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({
        new_category: '   ',
        category_id: '4',
        name: 'Café',
        required_points: '100',
        stock: '10',
      }),
    );

    expect(createCategory).not.toHaveBeenCalled();
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: '4' }),
    );
  });

  it('does not create the category when the product itself is invalid', async () => {
    const result = await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ new_category: 'Bebidas', name: '', required_points: '100', stock: '10' }),
    );

    expect(result.status).toBe('error');
    expect(createCategory).not.toHaveBeenCalled();
  });

  it('rolls the new category back when the product cannot be saved', async () => {
    (createProduct as jest.Mock).mockReturnValue({ data: null, error: { message: 'plan limit' } });

    const result = await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ new_category: 'Bebidas', name: 'Café', required_points: '100', stock: '10' }),
    );

    expect(result.status).toBe('error');
    expect(deleteCategory).toHaveBeenCalledWith('9');
  });

  it('does not delete a reused category when the product cannot be saved', async () => {
    (createCategory as jest.Mock).mockReturnValue({ data: { id: '9' }, error: null, created: false });
    (createProduct as jest.Mock).mockReturnValue({ data: null, error: { message: 'plan limit' } });

    await productFormAction(
      EMPTY_ACTION_STATE,
      formDataOf({ new_category: 'Bebidas', name: 'Café', required_points: '100', stock: '10' }),
    );

    expect(deleteCategory).not.toHaveBeenCalled();
  });
});
