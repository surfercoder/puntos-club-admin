import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { StockSchema } from '@/schemas/stock.schema';

import { createStock, updateStock } from '../actions';
import { stockFormAction } from '../stock-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/stock.schema', () => ({
  StockSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateStock = createStock as jest.MockedFunction<typeof createStock>;
const mockUpdateStock = updateStock as jest.MockedFunction<typeof updateStock>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockStockSchema = StockSchema as jest.Mocked<typeof StockSchema>;

describe('stockFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new stock', () => {
    beforeEach(() => {
      formData.append('branch_id', 'branch-1');
      formData.append('product_id', 'product-1');
      formData.append('quantity', '100');
      formData.append('minimum_quantity', '10');
      formData.append('last_updated', '2024-01-01T00:00:00Z');
    });

    it('should create stock successfully', async () => {
      const parsedData = {
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: 100,
        minimum_quantity: 10,
        last_updated: '2024-01-01T00:00:00Z',
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Stock created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await stockFormAction(prevState, formData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: '100',
        minimum_quantity: '10',
        last_updated: '2024-01-01T00:00:00Z',
      });

      expect(mockCreateStock).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/stock');
      expect(mockToActionState).toHaveBeenCalledWith('Stock created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['branch_id'], message: 'Branch ID is required' },
          { path: ['product_id'], message: 'Product ID is required' },
          { path: ['quantity'], message: 'Quantity must be a non-negative integer' },
        ],
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { branch_id: ['Branch ID is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await stockFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateStock).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['branch_id'], message: 'Branch ID is required' },
          { path: ['product_id'], message: 'Product ID is required' },
          { path: ['quantity'], message: 'Quantity is required' },
          { path: ['minimum_quantity'], message: 'Minimum quantity is required' },
        ],
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          branch_id: ['Branch ID is required'],
          product_id: ['Product ID is required'],
          quantity: ['Quantity is required'],
          minimum_quantity: ['Minimum quantity is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await stockFormAction(prevState, emptyFormData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: 100,
        minimum_quantity: 10,
        last_updated: '2024-01-01T00:00:00Z',
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateStock.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await stockFormAction(prevState, formData);

      expect(mockCreateStock).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing stock', () => {
    const stockId = '123';

    beforeEach(() => {
      formData.append('id', stockId);
      formData.append('branch_id', 'branch-2');
      formData.append('product_id', 'product-2');
      formData.append('quantity', '200');
      formData.append('minimum_quantity', '20');
      formData.append('last_updated', '2024-01-02T00:00:00Z');
    });

    it('should update stock successfully', async () => {
      const parsedData = {
        id: stockId,
        branch_id: 'branch-2',
        product_id: 'product-2',
        quantity: 200,
        minimum_quantity: 20,
        last_updated: '2024-01-02T00:00:00Z',
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Stock updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await stockFormAction(prevState, formData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({
        id: stockId,
        branch_id: 'branch-2',
        product_id: 'product-2',
        quantity: '200',
        minimum_quantity: '20',
        last_updated: '2024-01-02T00:00:00Z',
      });

      expect(mockUpdateStock).toHaveBeenCalledWith(stockId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/stock');
      expect(mockToActionState).toHaveBeenCalledWith('Stock updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['quantity'], message: 'Quantity must be non-negative' },
          { path: ['minimum_quantity'], message: 'Minimum quantity must be non-negative' },
        ],
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { quantity: ['Quantity must be non-negative'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await stockFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateStock).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: stockId,
        branch_id: 'branch-2',
        product_id: 'product-2',
        quantity: 200,
        minimum_quantity: 20,
        last_updated: '2024-01-02T00:00:00Z',
      };

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateStock.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await stockFormAction(prevState, formData);

      expect(mockUpdateStock).toHaveBeenCalledWith(stockId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('branch_id', 'branch-1');
      formData.append('product_id', 'product-1');
      formData.append('quantity', '100');
      formData.append('minimum_quantity', '10');
      formData.append('last_updated', '2024-01-01T00:00:00Z');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await stockFormAction(prevState, formData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({
        branch_id: 'branch-1',
        product_id: 'product-1',
        quantity: '100',
        minimum_quantity: '10',
        last_updated: '2024-01-01T00:00:00Z',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('branch_id', '  branch-1  ');
      formData.append('product_id', '  product-1  ');
      formData.append('quantity', '  100  ');

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await stockFormAction(prevState, formData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({
        branch_id: '  branch-1  ', // Whitespace preserved
        product_id: '  product-1  ',
        quantity: '  100  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockStockSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await stockFormAction(prevState, emptyFormData);

      expect(mockStockSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('branch_id', 'branch-1');
      formData.append('product_id', 'product-1');
      formData.append('quantity', '100');
      formData.append('minimum_quantity', '10');
    });

    it('should revalidate path on successful creation', async () => {
      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateStock.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await stockFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/stock');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateStock.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await stockFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/stock');
    });

    it('should not revalidate path on validation error', async () => {
      mockStockSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await stockFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockStockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateStock.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await stockFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});