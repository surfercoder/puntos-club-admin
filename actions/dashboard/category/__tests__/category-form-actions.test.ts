import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { CategorySchema } from '@/schemas/category.schema';

import { createCategory, updateCategory } from '../actions';
import { categoryFormAction } from '../category-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/category.schema', () => ({
  CategorySchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateCategory = createCategory as jest.MockedFunction<typeof createCategory>;
const mockUpdateCategory = updateCategory as jest.MockedFunction<typeof updateCategory>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockCategorySchema = CategorySchema as jest.Mocked<typeof CategorySchema>;

describe('categoryFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new category', () => {
    beforeEach(() => {
      formData.append('name', 'Test Category');
      formData.append('description', 'Test description');
      formData.append('active', 'true');
    });

    it('should create category successfully', async () => {
      const parsedData = {
        name: 'Test Category',
        description: 'Test description',
        active: true,
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Category created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test description',
        active: 'true',
      });

      expect(mockCreateCategory).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/category');
      expect(mockToActionState).toHaveBeenCalledWith('Category created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateCategory).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          name: ['Name is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await categoryFormAction(prevState, emptyFormData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        name: 'Test Category',
        description: 'Test description',
        active: true,
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateCategory.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockCreateCategory).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing category', () => {
    const categoryId = '123';

    beforeEach(() => {
      formData.append('id', categoryId);
      formData.append('name', 'Updated Category');
      formData.append('description', 'Updated description');
      formData.append('active', 'true');
    });

    it('should update category successfully', async () => {
      const parsedData = {
        id: categoryId,
        name: 'Updated Category',
        description: 'Updated description',
        active: true,
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Category updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({
        id: categoryId,
        name: 'Updated Category',
        description: 'Updated description',
        active: 'true',
      });

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/category');
      expect(mockToActionState).toHaveBeenCalledWith('Category updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name cannot be empty' },
        ],
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateCategory).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: categoryId,
        name: 'Updated Category',
        description: 'Updated description',
        active: true,
      };

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateCategory.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await categoryFormAction(prevState, formData);

      expect(mockUpdateCategory).toHaveBeenCalledWith(categoryId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('name', 'Test Category');
      formData.append('description', 'Test description');
      formData.append('active', 'true');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await categoryFormAction(prevState, formData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Category',
        description: 'Test description',
        active: 'true',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('name', '  Test Category  ');
      formData.append('description', '  Test description  ');

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await categoryFormAction(prevState, formData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({
        name: '  Test Category  ', // Whitespace preserved
        description: '  Test description  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockCategorySchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await categoryFormAction(prevState, emptyFormData);

      expect(mockCategorySchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('name', 'Test Category');
    });

    it('should revalidate path on successful creation', async () => {
      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateCategory.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await categoryFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/category');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateCategory.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await categoryFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/category');
    });

    it('should not revalidate path on validation error', async () => {
      mockCategorySchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await categoryFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockCategorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateCategory.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await categoryFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});