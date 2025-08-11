import { createAddress, updateAddress, deleteAddress } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { AddressSchema } from '@/schemas/address.schema';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/address.schema');
const mockAddressSchema = AddressSchema as jest.Mocked<typeof AddressSchema>;

describe('Address Actions', () => {
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock functions
    mockFrom = jest.fn();
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDelete = jest.fn();
    mockEq = jest.fn();
    mockSingle = jest.fn();

    // Setup mock client
    mockSupabaseClient = {
      from: mockFrom,
    };

    // Configure the client mock
    mockCreateClient.mockResolvedValue(mockSupabaseClient);

    // Setup default chain methods
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    });

    mockSingle.mockReturnValue({
      data: null,
      error: null,
    });
  });

  describe('createAddress', () => {
    const validAddressInput = {
      city: 'Test City',
      number: '123',
      state: 'Test State',
      street: 'Test Street',
      zip_code: '12345',
    };

    it('should create address successfully with valid input', async () => {
      const mockData = { id: '1', ...validAddressInput };
      
      // Mock schema validation success
      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAddressInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createAddress(validAddressInput as any);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith(validAddressInput);
      expect(mockFrom).toHaveBeenCalledWith('address');
      expect(mockInsert).toHaveBeenCalledWith([validAddressInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        city: '', // Invalid: empty city
        street: '', // Invalid: empty street
        number: '123',
        state: 'Test State',
        zip_code: '12345',
      };

      const mockErrors = [
        {
          path: ['city'],
          message: 'City is required',
        },
        {
          path: ['street'],
          message: 'Street is required',
        },
      ];

      // Mock schema validation failure
      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAddress(invalidInput as any);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            city: 'City is required',
            street: 'Street is required',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAddressInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createAddress(validAddressInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should handle validation errors with empty path', async () => {
      const mockErrors = [
        { path: [], message: 'General validation error' },
        { path: ['city'], message: 'City is required' },
      ];

      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAddress({} as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            city: 'City is required',
          },
        },
      });
    });
  })

  describe('updateAddress', () => {
    const addressId = 'address-1';
    const validUpdateInput = {
      city: 'Updated City',
      number: '456',
      state: 'Updated State',
      street: 'Updated Street',
      zip_code: '54321',
    };

    it('should update address successfully', async () => {
      const mockUpdatedData = { id: addressId, ...validUpdateInput };

      // Mock schema validation success
      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateAddress(addressId, validUpdateInput as any);

      expect(mockAddressSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('address');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', addressId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        city: '',
        zip_code: 'invalid', // Invalid format
        number: '456',
        state: 'Updated State',
        street: 'Updated Street',
      };

      const mockErrors = [
        { path: ['city'], message: 'City is required' },
        { path: ['zip_code'], message: 'Invalid zip code format' },
      ];

      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateAddress(addressId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            city: 'City is required',
            zip_code: 'Invalid zip code format',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockAddressSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateAddress(addressId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  })

  describe('deleteAddress', () => {
    it('should delete address successfully', async () => {
      const addressId = 'address-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteAddress(addressId);

      expect(mockFrom).toHaveBeenCalledWith('address');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', addressId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const addressId = 'address-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteAddress(addressId);

      expect(result).toEqual({ error: mockDatabaseError });
    });

  });
});