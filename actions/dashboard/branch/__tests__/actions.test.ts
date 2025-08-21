import { createClient } from '@/lib/supabase/server';
import { BranchSchema } from '@/schemas/branch.schema';

import { createBranch, updateBranch, deleteBranch } from '../actions';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/branch.schema');
const mockBranchSchema = BranchSchema as jest.Mocked<typeof BranchSchema>;

describe('Branch Actions', () => {
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

  describe('createBranch', () => {
    const validBranchInput = {
      name: 'Test Branch',
      address: 'Test Address',
    };

    it('should create branch successfully with valid input', async () => {
      const mockData = { id: '1', ...validBranchInput };
      
      // Mock schema validation success
      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validBranchInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createBranch(validBranchInput as any);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith(validBranchInput);
      expect(mockFrom).toHaveBeenCalledWith('branch');
      expect(mockInsert).toHaveBeenCalledWith([validBranchInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        name: '', // Invalid: empty name
        address: '', // Invalid: empty address
      };

      const mockErrors = [
        {
          path: ['name'],
          message: 'Name is required',
        },
        {
          path: ['address'],
          message: 'Address is required',
        },
      ];

      // Mock schema validation failure
      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createBranch(invalidInput as any);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            address: 'Address is required',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validBranchInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createBranch(validBranchInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('updateBranch', () => {
    const branchId = 'branch-1';
    const validUpdateInput = {
      name: 'Updated Branch',
      address: 'Updated Address',
    };

    it('should update branch successfully', async () => {
      const mockUpdatedData = { id: branchId, ...validUpdateInput };

      // Mock schema validation success
      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateBranch(branchId, validUpdateInput as any);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('branch');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', branchId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        name: '',
        address: 'invalid', // Invalid input
      };

      const mockErrors = [
        { path: ['name'], message: 'Name is required' },
        { path: ['address'], message: 'Address must be valid' },
      ];

      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateBranch(branchId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            address: 'Address must be valid',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockBranchSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateBranch(branchId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      const branchId = 'branch-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteBranch(branchId);

      expect(mockFrom).toHaveBeenCalledWith('branch');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', branchId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const branchId = 'branch-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteBranch(branchId);

      expect(result).toEqual({ error: mockDatabaseError });
    });
  });
});