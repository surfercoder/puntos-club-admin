import { addressFormAction } from '../address-form-actions';
import { createAddress, updateAddress } from '../actions';
import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { AddressSchema } from '@/schemas/address.schema';
import { revalidatePath } from 'next/cache';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/address.schema', () => ({
  AddressSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateAddress = createAddress as jest.MockedFunction<typeof createAddress>;
const mockUpdateAddress = updateAddress as jest.MockedFunction<typeof updateAddress>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockAddressSchema = AddressSchema as jest.Mocked<typeof AddressSchema>;

describe('addressFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new address', () => {
    beforeEach(() => {
      formData.append('street', '123 Main St');
      formData.append('number', '456');
      formData.append('city', 'Test City');
      formData.append('state', 'Test State');
      formData.append('zip_code', '12345');
    });

    it('should create address successfully', async () => {
      const parsedData = {
        street: '123 Main St',
        number: '456',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Address created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await addressFormAction(prevState, formData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({
        street: '123 Main St',
        number: '456',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
      });

      expect(mockCreateAddress).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/address');
      expect(mockToActionState).toHaveBeenCalledWith('Address created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['street'], message: 'Street is required' },
          { path: ['city'], message: 'City is required' },
        ],
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { street: ['Street is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await addressFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateAddress).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['street'], message: 'Street is required' },
          { path: ['number'], message: 'Number is required' },
          { path: ['city'], message: 'City is required' },
          { path: ['state'], message: 'State is required' },
          { path: ['zip_code'], message: 'Zip code is required' },
        ],
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          street: ['Street is required'],
          number: ['Number is required'],
          city: ['City is required'],
          state: ['State is required'],
          zip_code: ['Zip code is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await addressFormAction(prevState, emptyFormData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        street: '123 Main St',
        number: '456',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateAddress.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await addressFormAction(prevState, formData);

      expect(mockCreateAddress).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing address', () => {
    const addressId = '123';

    beforeEach(() => {
      formData.append('id', addressId);
      formData.append('street', '456 Oak Ave');
      formData.append('number', '789');
      formData.append('city', 'Updated City');
      formData.append('state', 'Updated State');
      formData.append('zip_code', '54321');
    });

    it('should update address successfully', async () => {
      const parsedData = {
        id: addressId,
        street: '456 Oak Ave',
        number: '789',
        city: 'Updated City',
        state: 'Updated State',
        zip_code: '54321',
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Address updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await addressFormAction(prevState, formData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({
        id: addressId,
        street: '456 Oak Ave',
        number: '789',
        city: 'Updated City',
        state: 'Updated State',
        zip_code: '54321',
      });

      expect(mockUpdateAddress).toHaveBeenCalledWith(Number(addressId), parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/address');
      expect(mockToActionState).toHaveBeenCalledWith('Address updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle numeric id conversion', async () => {
      const parsedData = {
        id: '999',
        street: '456 Oak Ave',
        number: '789',
        city: 'Updated City',
        state: 'Updated State',
        zip_code: '54321',
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Address updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const updateFormData = new FormData();
      updateFormData.append('id', '999');
      updateFormData.append('street', '456 Oak Ave');
      updateFormData.append('number', '789');
      updateFormData.append('city', 'Updated City');
      updateFormData.append('state', 'Updated State');
      updateFormData.append('zip_code', '54321');

      await addressFormAction(prevState, updateFormData);

      expect(mockUpdateAddress).toHaveBeenCalledWith(999, parsedData); // Number conversion
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['street'], message: 'Street cannot be empty' },
        ],
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { street: ['Street cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await addressFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateAddress).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: addressId,
        street: '456 Oak Ave',
        number: '789',
        city: 'Updated City',
        state: 'Updated State',
        zip_code: '54321',
      };

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateAddress.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await addressFormAction(prevState, formData);

      expect(mockUpdateAddress).toHaveBeenCalledWith(Number(addressId), parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('street', 'Main Street');
      formData.append('number', '100');
      formData.append('city', 'Test City');
      formData.append('state', 'Test State');
      formData.append('zip_code', '12345');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({
        street: 'Main Street',
        number: '100',
        city: 'Test City',
        state: 'Test State',
        zip_code: '12345',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('street', '  Main Street  ');
      formData.append('number', '  100  ');
      formData.append('city', '  Test City  ');

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({
        street: '  Main Street  ', // Whitespace preserved
        number: '  100  ',
        city: '  Test City  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockAddressSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await addressFormAction(prevState, emptyFormData);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('street', '123 Main St');
      formData.append('number', '456');
      formData.append('city', 'Test City');
      formData.append('state', 'Test State');
      formData.append('zip_code', '12345');
    });

    it('should revalidate path on successful creation', async () => {
      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateAddress.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/address');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateAddress.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/address');
    });

    it('should not revalidate path on validation error', async () => {
      mockAddressSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await addressFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateAddress.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await addressFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle non-numeric id gracefully', async () => {
      formData.append('id', 'not-a-number');
      formData.append('street', '123 Main St');

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: 'not-a-number' },
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      // Number('not-a-number') returns NaN
      expect(mockUpdateAddress).toHaveBeenCalledWith(NaN, { id: 'not-a-number' });
    });

    it('should handle zero id', async () => {
      formData.append('id', '0');
      formData.append('street', '123 Main St');

      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '0' },
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await addressFormAction(prevState, formData);

      expect(mockUpdateAddress).toHaveBeenCalledWith(0, { id: '0' });
    });

    it('should handle undefined/null errors gracefully', async () => {
      mockAddressSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateAddress.mockRejectedValue(null);
      mockFromErrorToActionState.mockReturnValue({ message: 'Unknown error' });

      const result = await addressFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(null);
      expect(result).toEqual({ message: 'Unknown error' });
    });
  });
});