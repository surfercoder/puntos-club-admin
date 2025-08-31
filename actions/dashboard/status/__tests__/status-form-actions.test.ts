import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { StatusSchema } from '@/schemas/status.schema';

import { createStatus, updateStatus } from '../actions';
import { statusFormAction } from '../status-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/status.schema', () => ({
  StatusSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateStatus = createStatus as jest.MockedFunction<typeof createStatus>;
const mockUpdateStatus = updateStatus as jest.MockedFunction<typeof updateStatus>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockStatusSchema = StatusSchema as jest.Mocked<typeof StatusSchema>;

describe('statusFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new status', () => {
    beforeEach(() => {
      formData.append('name', 'Test Status');
      formData.append('description', 'Test description');
      formData.append('is_terminal', 'true');
      formData.append('order_num', '5');
    });

    it('should create status successfully', async () => {
      const parsedData = {
        name: 'Test Status',
        description: 'Test description',
        is_terminal: true,
        order_num: 5,
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Status created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await statusFormAction(prevState, formData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Status',
        description: 'Test description',
        is_terminal: 'true',
        order_num: '5',
      });

      expect(mockCreateStatus).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/status');
      expect(mockToActionState).toHaveBeenCalledWith('Status created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
          { path: ['order_num'], message: 'Order number must be an integer' },
        ],
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await statusFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateStatus).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
          { path: ['order_num'], message: 'Order number is required' },
        ],
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          name: ['Name is required'],
          order_num: ['Order number is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await statusFormAction(prevState, emptyFormData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        name: 'Test Status',
        description: 'Test description',
        is_terminal: true,
        order_num: 5,
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateStatus.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await statusFormAction(prevState, formData);

      expect(mockCreateStatus).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing status', () => {
    const statusId = '123';

    beforeEach(() => {
      formData.append('id', statusId);
      formData.append('name', 'Updated Status');
      formData.append('description', 'Updated description');
      formData.append('is_terminal', 'false');
      formData.append('order_num', '10');
    });

    it('should update status successfully', async () => {
      const parsedData = {
        id: statusId,
        name: 'Updated Status',
        description: 'Updated description',
        is_terminal: false,
        order_num: 10,
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Status updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await statusFormAction(prevState, formData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({
        id: statusId,
        name: 'Updated Status',
        description: 'Updated description',
        is_terminal: 'false',
        order_num: '10',
      });

      expect(mockUpdateStatus).toHaveBeenCalledWith(statusId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/status');
      expect(mockToActionState).toHaveBeenCalledWith('Status updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name cannot be empty' },
        ],
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await statusFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateStatus).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: statusId,
        name: 'Updated Status',
        description: 'Updated description',
        is_terminal: false,
        order_num: 10,
      };

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateStatus.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await statusFormAction(prevState, formData);

      expect(mockUpdateStatus).toHaveBeenCalledWith(statusId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('name', 'Test Status');
      formData.append('description', 'Test description');
      formData.append('is_terminal', 'true');
      formData.append('order_num', '5');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await statusFormAction(prevState, formData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Status',
        description: 'Test description',
        is_terminal: 'true',
        order_num: '5',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('name', '  Test Status  ');
      formData.append('description', '  Test description  ');
      formData.append('order_num', '  5  ');

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await statusFormAction(prevState, formData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({
        name: '  Test Status  ', // Whitespace preserved
        description: '  Test description  ',
        order_num: '  5  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockStatusSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await statusFormAction(prevState, emptyFormData);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('name', 'Test Status');
      formData.append('order_num', '1');
    });

    it('should revalidate path on successful creation', async () => {
      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateStatus.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await statusFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/status');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateStatus.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await statusFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/status');
    });

    it('should not revalidate path on validation error', async () => {
      mockStatusSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await statusFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockStatusSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateStatus.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await statusFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});