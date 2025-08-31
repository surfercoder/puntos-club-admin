import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { HistorySchema } from '@/schemas/history.schema';

import { createHistory, updateHistory } from '../actions';
import { historyFormAction } from '../history-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/history.schema', () => ({
  HistorySchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateHistory = createHistory as jest.MockedFunction<typeof createHistory>;
const mockUpdateHistory = updateHistory as jest.MockedFunction<typeof updateHistory>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockHistorySchema = HistorySchema as jest.Mocked<typeof HistorySchema>;

describe('historyFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new history', () => {
    beforeEach(() => {
      formData.append('order_id', 'order-1');
      formData.append('status_id', 'status-1');
      formData.append('change_date', '2024-01-01T00:00:00Z');
      formData.append('observations', 'Test observations');
    });

    it('should create history successfully', async () => {
      const parsedData = {
        order_id: 'order-1',
        status_id: 'status-1',
        change_date: '2024-01-01T00:00:00Z',
        observations: 'Test observations',
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'History created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await historyFormAction(prevState, formData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({
        order_id: 'order-1',
        status_id: 'status-1',
        change_date: '2024-01-01T00:00:00Z',
        observations: 'Test observations',
      });

      expect(mockCreateHistory).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/history');
      expect(mockToActionState).toHaveBeenCalledWith('History created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['order_id'], message: 'Order ID is required' },
        ],
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { order_id: ['Order ID is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await historyFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateHistory).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['order_id'], message: 'Order ID is required' },
        ],
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          order_id: ['Order ID is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await historyFormAction(prevState, emptyFormData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        order_id: 'order-1',
        status_id: 'status-1',
        change_date: '2024-01-01T00:00:00Z',
        observations: 'Test observations',
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateHistory.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await historyFormAction(prevState, formData);

      expect(mockCreateHistory).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing history', () => {
    const historyId = '123';

    beforeEach(() => {
      formData.append('id', historyId);
      formData.append('order_id', 'order-2');
      formData.append('status_id', 'status-2');
      formData.append('change_date', '2024-01-02T00:00:00Z');
      formData.append('observations', 'Updated observations');
    });

    it('should update history successfully', async () => {
      const parsedData = {
        id: historyId,
        order_id: 'order-2',
        status_id: 'status-2',
        change_date: '2024-01-02T00:00:00Z',
        observations: 'Updated observations',
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'History updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await historyFormAction(prevState, formData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({
        id: historyId,
        order_id: 'order-2',
        status_id: 'status-2',
        change_date: '2024-01-02T00:00:00Z',
        observations: 'Updated observations',
      });

      expect(mockUpdateHistory).toHaveBeenCalledWith(historyId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/history');
      expect(mockToActionState).toHaveBeenCalledWith('History updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['order_id'], message: 'Order ID cannot be empty' },
        ],
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { order_id: ['Order ID cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await historyFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateHistory).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: historyId,
        order_id: 'order-2',
        status_id: 'status-2',
        change_date: '2024-01-02T00:00:00Z',
        observations: 'Updated observations',
      };

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateHistory.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await historyFormAction(prevState, formData);

      expect(mockUpdateHistory).toHaveBeenCalledWith(historyId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('order_id', 'order-1');
      formData.append('status_id', 'status-1');
      formData.append('change_date', '2024-01-01T00:00:00Z');
      formData.append('observations', 'Test observations');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await historyFormAction(prevState, formData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({
        order_id: 'order-1',
        status_id: 'status-1',
        change_date: '2024-01-01T00:00:00Z',
        observations: 'Test observations',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('order_id', '  order-1  ');
      formData.append('observations', '  Test observations  ');

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await historyFormAction(prevState, formData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({
        order_id: '  order-1  ', // Whitespace preserved
        observations: '  Test observations  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockHistorySchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await historyFormAction(prevState, emptyFormData);

      expect(mockHistorySchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('order_id', 'order-1');
    });

    it('should revalidate path on successful creation', async () => {
      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateHistory.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await historyFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/history');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateHistory.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await historyFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/history');
    });

    it('should not revalidate path on validation error', async () => {
      mockHistorySchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await historyFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockHistorySchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateHistory.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await historyFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});