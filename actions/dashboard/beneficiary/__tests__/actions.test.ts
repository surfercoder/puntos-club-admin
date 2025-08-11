import { createBeneficiary, updateBeneficiary, deleteBeneficiary } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/beneficiary.schema');
const mockBeneficiarySchema = BeneficiarySchema as jest.Mocked<typeof BeneficiarySchema>;

describe('Beneficiary Actions', () => {
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

  describe('createBeneficiary', () => {
    const validBeneficiaryInput = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      document_id: 'DOC123456',
      available_points: 100,
      registration_date: '2024-01-01T00:00:00Z',
    };

    it('should create beneficiary successfully with valid input', async () => {
      const mockData = { id: 'ben-123', ...validBeneficiaryInput };
      
      // Mock schema validation success
      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validBeneficiaryInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createBeneficiary(validBeneficiaryInput as any);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith(validBeneficiaryInput);
      expect(mockFrom).toHaveBeenCalledWith('beneficiary');
      expect(mockInsert).toHaveBeenCalledWith([validBeneficiaryInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        first_name: 'John',
        email: 'invalid-email', // Invalid: bad format
        available_points: -10, // Invalid: negative points
      };

      const mockErrors = [
        {
          path: ['email'],
          message: 'Invalid email format',
        },
        {
          path: ['available_points'],
          message: 'Points must be a positive number',
        },
      ];

      // Mock schema validation failure
      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createBeneficiary(invalidInput as any);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            email: 'Invalid email format',
            available_points: 'Points must be a positive number',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validBeneficiaryInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createBeneficiary(validBeneficiaryInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should handle validation errors with multiple fields', async () => {
      const invalidInput = {
        first_name: '',
        email: 123, // Invalid type
        available_points: -5,
      };

      const mockErrors = [
        { path: ['first_name'], message: 'First name is required' },
        { path: ['email'], message: 'Email must be a string or null' },
        { path: ['available_points'], message: 'Points must be non-negative' },
      ];

      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createBeneficiary(invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            first_name: 'First name is required',
            email: 'Email must be a string or null',
            available_points: 'Points must be non-negative',
          },
        },
      });
    });

    it('should handle validation errors with empty path', async () => {
      const mockErrors = [
        { path: [], message: 'General validation error' },
        { path: ['email'], message: 'Email is required' },
      ];

      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createBeneficiary({} as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            email: 'Email is required',
          },
        },
      });
    });
  })

  describe('updateBeneficiary', () => {
    const beneficiaryId = 'ben-123';
    const validUpdateInput = {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+9876543210',
      document_id: 'DOC789012',
      available_points: 200,
      registration_date: '2024-01-02T00:00:00Z',
    };

    it('should update beneficiary successfully', async () => {
      const mockUpdatedData = { id: beneficiaryId, ...validUpdateInput };

      // Mock schema validation success
      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateBeneficiary(beneficiaryId, validUpdateInput as any);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('beneficiary');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', beneficiaryId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        email: 'invalid-email',
        phone: 'invalid', // Invalid phone format
      };

      const mockErrors = [
        { path: ['email'], message: 'Invalid email format' },
        { path: ['phone'], message: 'Invalid phone number' },
      ];

      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateBeneficiary(beneficiaryId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            email: 'Invalid email format',
            phone: 'Invalid phone number',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockBeneficiarySchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateBeneficiary(beneficiaryId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

  })

  describe('deleteBeneficiary', () => {
    it('should delete beneficiary successfully', async () => {
      const beneficiaryId = 'ben-123';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteBeneficiary(beneficiaryId);

      expect(mockFrom).toHaveBeenCalledWith('beneficiary');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', beneficiaryId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const beneficiaryId = 'ben-123';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteBeneficiary(beneficiaryId);

      expect(result).toEqual({ error: mockDatabaseError });
    });

  });
});