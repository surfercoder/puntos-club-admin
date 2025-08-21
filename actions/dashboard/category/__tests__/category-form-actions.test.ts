import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

import { createCategory, updateCategory } from '../actions';
import { categoryFormAction } from '../category-form-actions';

// Mock the actions
jest.mock('../actions');
const mockCreateCategory = createCategory as jest.MockedFunction<typeof createCategory>;
const mockUpdateCategory = updateCategory as jest.MockedFunction<typeof updateCategory>;

describe('categoryFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new category', () => {
    beforeEach(() => {
      formData.append('name', 'Test Category');
      formData.append('description', 'Test description');
      formData.append('active', 'on'); // checkbox is 'on' when checked
    });

    it('should create category successfully', async () => {
      const mockCreatedCategory = {
        id: '1',
        name: 'Test Category',
        description: 'Test description',
        active: true,
      };

      mockCreateCategory.mockResolvedValue({
        data: mockCreatedCategory,
        error: null,
      });

      const result = await categoryFormAction(prevState, formData);

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test description',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Category created successfully!',
      });
    });

    it('should handle creation with null description', async () => {
      const formDataWithoutDesc = new FormData();
      formDataWithoutDesc.append('name', 'Test Category');
      formDataWithoutDesc.append('active', 'on');

      mockCreateCategory.mockResolvedValue({
        data: { id: '1', name: 'Test Category', active: true },
        error: null,
      });

      const result = await categoryFormAction(prevState, formDataWithoutDesc);

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        description: null,
        active: true,
      });

      expect(result.message).toBe('Category created successfully!');
    });

    it('should handle unchecked active checkbox', async () => {
      const formDataInactive = new FormData();
      formDataInactive.append('name', 'Test Category');
      formDataInactive.append('description', 'Test description');
      // No 'active' field means checkbox is unchecked

      mockCreateCategory.mockResolvedValue({
        data: { id: '1', name: 'Test Category', active: false },
        error: null,
      });

      const result = await categoryFormAction(prevState, formDataInactive);

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test description',
        active: false,
      });
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name is required',
            description: 'Description must be a string',
          },
        },
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name is required'],
          description: ['Description must be a string'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the category.',
      });
    });
  });

  describe('updating existing category', () => {
    const categoryId = 'category-1';

    beforeEach(() => {
      formData.append('id', categoryId);
      formData.append('name', 'Updated Category');
      formData.append('description', 'Updated description');
      formData.append('active', 'on');
    });

    it('should update category successfully', async () => {
      const mockUpdatedCategory = {
        id: categoryId,
        name: 'Updated Category',
        description: 'Updated description',
        active: true,
      };

      mockUpdateCategory.mockResolvedValue({
        data: mockUpdatedCategory,
        error: null,
      });

      const result = await categoryFormAction(prevState, formData);

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, {
        name: 'Updated Category',
        description: 'Updated description',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Category updated successfully!',
      });
    });

    it('should handle update with empty description', async () => {
      const formDataEmptyDesc = new FormData();
      formDataEmptyDesc.append('id', categoryId);
      formDataEmptyDesc.append('name', 'Updated Category');
      formDataEmptyDesc.append('description', ''); // Empty string should become null
      formDataEmptyDesc.append('active', 'on');

      mockUpdateCategory.mockResolvedValue({
        data: { id: categoryId, name: 'Updated Category', active: true },
        error: null,
      });

      const result = await categoryFormAction(prevState, formDataEmptyDesc);

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, {
        name: 'Updated Category',
        description: null,
        active: true,
      });

      expect(result.message).toBe('Category updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateCategory.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name cannot be empty',
          },
        },
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateCategory.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the category.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateCategory.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await categoryFormAction(prevState, emptyFormData);

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: null, // Missing fields become null
        description: null,
        active: false,
      });
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('name', '  Test Category  ');
      formData.append('description', '  Test description  ');

      mockCreateCategory.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await categoryFormAction(prevState, formData);

      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: '  Test Category  ', // Whitespace is preserved
        description: '  Test description  ',
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
        testFormData.append('name', 'Test');
        testFormData.append('active', testCase.value);

        mockCreateCategory.mockClear();
        mockCreateCategory.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await categoryFormAction(prevState, testFormData);

        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: 'Test',
          description: null,
          active: testCase.expected,
        });
      }
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('name', 'Test Category');
    });

    it('should handle undefined error object', async () => {
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the category.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the category.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Single string error',
            description: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await categoryFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        name: ['Single string error'],
        description: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateCategory.mockRejectedValue(new Error('Network error'));

      formData.append('name', 'Test Category');

      await expect(categoryFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', name: 'Test Category' },
            error: null,
          });
        }, 100);
      });

      mockCreateCategory.mockReturnValue(slowResponse as any);

      formData.append('name', 'Test Category');

      const result = await categoryFormAction(prevState, formData);

      expect(result.message).toBe('Category created successfully!');
    });
  });
});