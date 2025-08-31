import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { ProductSchema } from '@/schemas/product.schema';

import { createProduct, updateProduct } from '../actions';
import { productFormAction } from '../product-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/product.schema', () => ({
  ProductSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateProduct = createProduct as jest.MockedFunction<typeof createProduct>;
const mockUpdateProduct = updateProduct as jest.MockedFunction<typeof updateProduct>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockProductSchema = ProductSchema as jest.Mocked<typeof ProductSchema>;

describe('productFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new product', () => {
    beforeEach(() => {
      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('description', 'Test description');
      formData.append('required_points', '100');
      formData.append('active', 'true');
    });

    it('should create product successfully', async () => {
      const parsedData = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 100,
        active: true,
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Product created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await productFormAction(prevState, formData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: '100',
        active: 'true',
      });

      expect(mockCreateProduct).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/product');
      expect(mockToActionState).toHaveBeenCalledWith('Product created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['subcategory_id'], message: 'Subcategory is required' },
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { subcategory_id: ['Subcategory is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await productFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateProduct).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['subcategory_id'], message: 'Subcategory is required' },
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          subcategory_id: ['Subcategory is required'],
          name: ['Name is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await productFormAction(prevState, emptyFormData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 100,
        active: true,
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateProduct.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await productFormAction(prevState, formData);

      expect(mockCreateProduct).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing product', () => {
    const productId = '123';

    beforeEach(() => {
      formData.append('id', productId);
      formData.append('subcategory_id', 'subcat-2');
      formData.append('name', 'Updated Product');
      formData.append('description', 'Updated description');
      formData.append('required_points', '150');
      formData.append('active', 'true');
    });

    it('should update product successfully', async () => {
      const parsedData = {
        id: productId,
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: 'Updated description',
        required_points: 150,
        active: true,
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Product updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await productFormAction(prevState, formData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({
        id: productId,
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: 'Updated description',
        required_points: '150',
        active: 'true',
      });

      expect(mockUpdateProduct).toHaveBeenCalledWith(productId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/product');
      expect(mockToActionState).toHaveBeenCalledWith('Product updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name cannot be empty' },
        ],
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await productFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateProduct).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: productId,
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: 'Updated description',
        required_points: 150,
        active: true,
      };

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateProduct.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await productFormAction(prevState, formData);

      expect(mockUpdateProduct).toHaveBeenCalledWith(productId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('description', 'Test description');
      formData.append('required_points', '100');
      formData.append('active', 'true');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await productFormAction(prevState, formData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: '100',
        active: 'true',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('name', '  Test Product  ');
      formData.append('subcategory_id', '  subcat-1  ');
      formData.append('required_points', '  100  ');

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await productFormAction(prevState, formData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({
        name: '  Test Product  ', // Whitespace preserved
        subcategory_id: '  subcat-1  ',
        required_points: '  100  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockProductSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await productFormAction(prevState, emptyFormData);

      expect(mockProductSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('required_points', '100');
    });

    it('should revalidate path on successful creation', async () => {
      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateProduct.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await productFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/product');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateProduct.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await productFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/product');
    });

    it('should not revalidate path on validation error', async () => {
      mockProductSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await productFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockProductSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateProduct.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await productFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});