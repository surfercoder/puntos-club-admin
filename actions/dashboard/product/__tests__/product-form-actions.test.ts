import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

import { createProduct, updateProduct } from '../actions';
import { productFormAction } from '../product-form-actions';

// Mock the actions
jest.mock('../actions');
const mockCreateProduct = createProduct as jest.MockedFunction<typeof createProduct>;
const mockUpdateProduct = updateProduct as jest.MockedFunction<typeof updateProduct>;

describe('productFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new product', () => {
    beforeEach(() => {
      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('description', 'Test description');
      formData.append('required_points', '100');
      formData.append('active', 'on'); // checkbox is 'on' when checked
    });

    it('should create product successfully', async () => {
      const mockCreatedProduct = {
        id: '1',
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 100,
        active: true,
      };

      mockCreateProduct.mockResolvedValue({
        data: mockCreatedProduct,
        error: null,
      });

      const result = await productFormAction(prevState, formData);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 100,
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Product created successfully!',
      });
    });

    it('should handle creation with null description', async () => {
      const formDataWithoutDesc = new FormData();
      formDataWithoutDesc.append('subcategory_id', 'subcat-1');
      formDataWithoutDesc.append('name', 'Test Product');
      formDataWithoutDesc.append('required_points', '50');
      formDataWithoutDesc.append('active', 'on');

      mockCreateProduct.mockResolvedValue({
        data: { id: '1', name: 'Test Product', active: true },
        error: null,
      });

      const result = await productFormAction(prevState, formDataWithoutDesc);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: null,
        required_points: 50,
        active: true,
      });

      expect(result.message).toBe('Product created successfully!');
    });

    it('should handle unchecked active checkbox', async () => {
      const formDataInactive = new FormData();
      formDataInactive.append('subcategory_id', 'subcat-1');
      formDataInactive.append('name', 'Test Product');
      formDataInactive.append('description', 'Test description');
      formDataInactive.append('required_points', '75');
      // No 'active' field means checkbox is unchecked

      mockCreateProduct.mockResolvedValue({
        data: { id: '1', name: 'Test Product', active: false },
        error: null,
      });

      const result = await productFormAction(prevState, formDataInactive);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: 'Test description',
        required_points: 75,
        active: false,
      });
    });

    it('should handle invalid required_points input', async () => {
      const formDataInvalidPoints = new FormData();
      formDataInvalidPoints.append('subcategory_id', 'subcat-1');
      formDataInvalidPoints.append('name', 'Test Product');
      formDataInvalidPoints.append('required_points', 'not-a-number');

      mockCreateProduct.mockResolvedValue({
        data: { id: '1', name: 'Test Product' },
        error: null,
      });

      const result = await productFormAction(prevState, formDataInvalidPoints);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: null,
        required_points: 0, // parseInt fallback
        active: false,
      });
    });

    it('should handle missing required_points field', async () => {
      const formDataMissingPoints = new FormData();
      formDataMissingPoints.append('subcategory_id', 'subcat-1');
      formDataMissingPoints.append('name', 'Test Product');

      mockCreateProduct.mockResolvedValue({
        data: { id: '1', name: 'Test Product' },
        error: null,
      });

      const result = await productFormAction(prevState, formDataMissingPoints);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'subcat-1',
        name: 'Test Product',
        description: null,
        required_points: 0, // Default fallback
        active: false,
      });
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateProduct.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            subcategory_id: 'Subcategory is required',
            name: 'Name is required',
            required_points: 'Points must be non-negative',
          },
        },
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          subcategory_id: ['Subcategory is required'],
          name: ['Name is required'],
          required_points: ['Points must be non-negative'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateProduct.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the product.',
      });
    });
  });

  describe('updating existing product', () => {
    const productId = 'product-1';

    beforeEach(() => {
      formData.append('id', productId);
      formData.append('subcategory_id', 'subcat-2');
      formData.append('name', 'Updated Product');
      formData.append('description', 'Updated description');
      formData.append('required_points', '150');
      formData.append('active', 'on');
    });

    it('should update product successfully', async () => {
      const mockUpdatedProduct = {
        id: productId,
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: 'Updated description',
        required_points: 150,
        active: true,
      };

      mockUpdateProduct.mockResolvedValue({
        data: mockUpdatedProduct,
        error: null,
      });

      const result = await productFormAction(prevState, formData);

      expect(mockUpdateProduct).toHaveBeenCalledWith(productId, {
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: 'Updated description',
        required_points: 150,
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Product updated successfully!',
      });
    });

    it('should handle update with empty description', async () => {
      const formDataEmptyDesc = new FormData();
      formDataEmptyDesc.append('id', productId);
      formDataEmptyDesc.append('subcategory_id', 'subcat-2');
      formDataEmptyDesc.append('name', 'Updated Product');
      formDataEmptyDesc.append('description', ''); // Empty string should become null
      formDataEmptyDesc.append('required_points', '200');
      formDataEmptyDesc.append('active', 'on');

      mockUpdateProduct.mockResolvedValue({
        data: { id: productId, name: 'Updated Product', active: true },
        error: null,
      });

      const result = await productFormAction(prevState, formDataEmptyDesc);

      expect(mockUpdateProduct).toHaveBeenCalledWith(productId, {
        subcategory_id: 'subcat-2',
        name: 'Updated Product',
        description: null,
        required_points: 200,
        active: true,
      });

      expect(result.message).toBe('Product updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateProduct.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name cannot be empty',
            required_points: 'Points must be a positive integer',
          },
        },
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
          required_points: ['Points must be a positive integer'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateProduct.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the product.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateProduct.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await productFormAction(prevState, emptyFormData);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: null, // Missing fields become null
        name: null,
        description: null,
        required_points: 0,
        active: false,
      });
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('subcategory_id', '  subcat-1  ');
      formData.append('name', '  Test Product  ');
      formData.append('description', '  Test description  ');
      formData.append('required_points', '  100  '); // Whitespace around numbers

      mockCreateProduct.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await productFormAction(prevState, formData);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: '  subcat-1  ', // Whitespace is preserved for strings
        name: '  Test Product  ',
        description: '  Test description  ',
        required_points: 100, // parseInt handles whitespace
        active: false,
      });
    });

    it('should handle checkbox variations', async () => {
      // Test different checkbox values
      const testCases = [
        { value: 'on', expected: true },
        { value: 'true', expected: false }, // Only 'on' is truthy for checkboxes
        { value: '1', expected: false },
        { value: '', expected: false },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('subcategory_id', 'subcat-1');
        testFormData.append('name', 'Test');
        testFormData.append('required_points', '50');
        testFormData.append('active', testCase.value);

        mockCreateProduct.mockClear();
        mockCreateProduct.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await productFormAction(prevState, testFormData);

        expect(mockCreateProduct).toHaveBeenCalledWith({
          subcategory_id: 'subcat-1',
          name: 'Test',
          description: null,
          required_points: 50,
          active: testCase.expected,
        });
      }
    });

    it('should handle various required_points formats', async () => {
      const pointsTestCases = [
        { input: '0', expected: 0 },
        { input: '100', expected: 100 },
        { input: '999999', expected: 999999 },
        { input: '0.5', expected: 0 }, // parseInt truncates decimals
        { input: '100.9', expected: 100 },
        { input: 'abc', expected: 0 }, // Non-numeric falls back to 0
        { input: '-50', expected: -50 }, // Negative numbers allowed by parseInt
        { input: '', expected: 0 }, // Empty string fallback
      ];

      for (const testCase of pointsTestCases) {
        const testFormData = new FormData();
        testFormData.append('subcategory_id', 'subcat-1');
        testFormData.append('name', 'Test Product');
        testFormData.append('required_points', testCase.input);

        mockCreateProduct.mockClear();
        mockCreateProduct.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await productFormAction(prevState, testFormData);

        expect(mockCreateProduct).toHaveBeenCalledWith({
          subcategory_id: 'subcat-1',
          name: 'Test Product',
          description: null,
          required_points: testCase.expected,
          active: false,
        });
      }
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('required_points', '100');
    });

    it('should handle undefined error object', async () => {
      mockCreateProduct.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the product.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateProduct.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await productFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the product.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateProduct.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Single string error',
            description: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await productFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        name: ['Single string error'],
        description: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateProduct.mockRejectedValue(new Error('Network error'));

      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('required_points', '100');

      await expect(productFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', name: 'Test Product' },
            error: null,
          });
        }, 100);
      });

      mockCreateProduct.mockReturnValue(slowResponse as any);

      formData.append('subcategory_id', 'subcat-1');
      formData.append('name', 'Test Product');
      formData.append('required_points', '100');

      const result = await productFormAction(prevState, formData);

      expect(result.message).toBe('Product created successfully!');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete product creation workflow', async () => {
      // Full product with all fields
      const completeFormData = new FormData();
      completeFormData.append('subcategory_id', 'electronics-123');
      completeFormData.append('name', 'iPhone 15 Pro');
      completeFormData.append('description', 'Latest iPhone with advanced features');
      completeFormData.append('required_points', '50000');
      completeFormData.append('active', 'on');

      const expectedProduct = {
        id: 'product-xyz-123',
        subcategory_id: 'electronics-123',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features',
        required_points: 50000,
        active: true,
        creation_date: '2024-01-01T00:00:00Z',
      };

      mockCreateProduct.mockResolvedValue({
        data: expectedProduct,
        error: null,
      });

      const result = await productFormAction(prevState, completeFormData);

      expect(mockCreateProduct).toHaveBeenCalledWith({
        subcategory_id: 'electronics-123',
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced features',
        required_points: 50000,
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Product created successfully!',
      });
    });

    it('should handle product update workflow with partial data', async () => {
      const productId = 'existing-product-123';
      const updateFormData = new FormData();
      updateFormData.append('id', productId);
      updateFormData.append('subcategory_id', 'electronics-123');
      updateFormData.append('name', 'iPhone 15 Pro Max'); // Updated name
      updateFormData.append('required_points', '60000'); // Updated points
      // No description or active field - should use defaults

      mockUpdateProduct.mockResolvedValue({
        data: { id: productId, name: 'iPhone 15 Pro Max' },
        error: null,
      });

      const result = await productFormAction(prevState, updateFormData);

      expect(mockUpdateProduct).toHaveBeenCalledWith(productId, {
        subcategory_id: 'electronics-123',
        name: 'iPhone 15 Pro Max',
        description: null, // No description provided
        required_points: 60000,
        active: false, // Checkbox not checked
      });

      expect(result.message).toBe('Product updated successfully!');
    });
  });
});