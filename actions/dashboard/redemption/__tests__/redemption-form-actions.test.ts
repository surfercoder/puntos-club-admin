import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { RedemptionSchema } from '@/schemas/redemption.schema';

import { createRedemption, updateRedemption } from '../actions';
import { redemptionFormAction } from '../redemption-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/redemption.schema', () => ({
  RedemptionSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateRedemption = createRedemption as jest.MockedFunction<typeof createRedemption>;
const mockUpdateRedemption = updateRedemption as jest.MockedFunction<typeof updateRedemption>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockRedemptionSchema = RedemptionSchema as jest.Mocked<typeof RedemptionSchema>;

describe('redemptionFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new redemption', () => {
    beforeEach(() => {
      formData.append('beneficiary_id', 'beneficiary-1');
      formData.append('product_id', 'product-1');
      formData.append('order_id', 'order-1');
      formData.append('points_used', '100');
      formData.append('quantity', '2');
      formData.append('redemption_date', '2024-01-01T00:00:00Z');
    });

    it('should create redemption successfully', async () => {
      const parsedData = {
        beneficiary_id: 'beneficiary-1',
        product_id: 'product-1',
        order_id: 'order-1',
        points_used: 100,
        quantity: 2,
        redemption_date: '2024-01-01T00:00:00Z',
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Redemption created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({
        beneficiary_id: 'beneficiary-1',
        product_id: 'product-1',
        order_id: 'order-1',
        points_used: '100',
        quantity: '2',
        redemption_date: '2024-01-01T00:00:00Z',
      });

      expect(mockCreateRedemption).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
      expect(mockToActionState).toHaveBeenCalledWith('Redemption created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['beneficiary_id'], message: 'Beneficiary ID is required' },
          { path: ['order_id'], message: 'Order ID is required' },
        ],
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { beneficiary_id: ['Beneficiary ID is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateRedemption).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['beneficiary_id'], message: 'Beneficiary ID is required' },
          { path: ['order_id'], message: 'Order ID is required' },
          { path: ['points_used'], message: 'Points used is required' },
          { path: ['quantity'], message: 'Quantity is required' },
        ],
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          beneficiary_id: ['Beneficiary ID is required'],
          order_id: ['Order ID is required'],
          points_used: ['Points used is required'],
          quantity: ['Quantity is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await redemptionFormAction(prevState, emptyFormData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        beneficiary_id: 'beneficiary-1',
        product_id: 'product-1',
        order_id: 'order-1',
        points_used: 100,
        quantity: 2,
        redemption_date: '2024-01-01T00:00:00Z',
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateRedemption.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockCreateRedemption).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing redemption', () => {
    const redemptionId = '123';

    beforeEach(() => {
      formData.append('id', redemptionId);
      formData.append('beneficiary_id', 'beneficiary-2');
      formData.append('product_id', 'product-2');
      formData.append('order_id', 'order-2');
      formData.append('points_used', '150');
      formData.append('quantity', '3');
      formData.append('redemption_date', '2024-01-02T00:00:00Z');
    });

    it('should update redemption successfully', async () => {
      const parsedData = {
        id: redemptionId,
        beneficiary_id: 'beneficiary-2',
        product_id: 'product-2',
        order_id: 'order-2',
        points_used: 150,
        quantity: 3,
        redemption_date: '2024-01-02T00:00:00Z',
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Redemption updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({
        id: redemptionId,
        beneficiary_id: 'beneficiary-2',
        product_id: 'product-2',
        order_id: 'order-2',
        points_used: '150',
        quantity: '3',
        redemption_date: '2024-01-02T00:00:00Z',
      });

      expect(mockUpdateRedemption).toHaveBeenCalledWith(redemptionId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
      expect(mockToActionState).toHaveBeenCalledWith('Redemption updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['points_used'], message: 'Points used must be positive' },
        ],
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { points_used: ['Points used must be positive'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateRedemption).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: redemptionId,
        beneficiary_id: 'beneficiary-2',
        product_id: 'product-2',
        order_id: 'order-2',
        points_used: 150,
        quantity: 3,
        redemption_date: '2024-01-02T00:00:00Z',
      };

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateRedemption.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await redemptionFormAction(prevState, formData);

      expect(mockUpdateRedemption).toHaveBeenCalledWith(redemptionId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('beneficiary_id', 'beneficiary-1');
      formData.append('product_id', 'product-1');
      formData.append('order_id', 'order-1');
      formData.append('points_used', '100');
      formData.append('quantity', '2');
      formData.append('redemption_date', '2024-01-01T00:00:00Z');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await redemptionFormAction(prevState, formData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({
        beneficiary_id: 'beneficiary-1',
        product_id: 'product-1',
        order_id: 'order-1',
        points_used: '100',
        quantity: '2',
        redemption_date: '2024-01-01T00:00:00Z',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('beneficiary_id', '  beneficiary-1  ');
      formData.append('order_id', '  order-1  ');
      formData.append('points_used', '  100  ');

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await redemptionFormAction(prevState, formData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({
        beneficiary_id: '  beneficiary-1  ', // Whitespace preserved
        order_id: '  order-1  ',
        points_used: '  100  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await redemptionFormAction(prevState, emptyFormData);

      expect(mockRedemptionSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('beneficiary_id', 'beneficiary-1');
      formData.append('order_id', 'order-1');
      formData.append('points_used', '100');
      formData.append('quantity', '1');
    });

    it('should revalidate path on successful creation', async () => {
      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateRedemption.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await redemptionFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateRedemption.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await redemptionFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/redemption');
    });

    it('should not revalidate path on validation error', async () => {
      mockRedemptionSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await redemptionFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockRedemptionSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateRedemption.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await redemptionFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});