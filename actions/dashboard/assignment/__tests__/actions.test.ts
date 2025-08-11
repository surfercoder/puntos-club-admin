import { createAssignment, updateAssignment, deleteAssignment } from '../actions';
import { createClient } from '@/lib/supabase/server';
import { AssignmentSchema } from '@/schemas/assignment.schema';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/assignment.schema');
const mockAssignmentSchema = AssignmentSchema as jest.Mocked<typeof AssignmentSchema>;

describe('Assignment Actions', () => {
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

  describe('createAssignment', () => {
    const validAssignmentInput = {
      branch_id: 'branch-456',
      beneficiary_id: 'ben-789',
      user_id: 'user-101',
      points: 50,
      reason: 'Welcome bonus',
      assignment_date: '2024-01-01T00:00:00Z',
      observations: 'Initial point assignment',
    };

    it('should create assignment successfully with valid input', async () => {
      const mockData = { id: 'assign-123', ...validAssignmentInput };
      
      // Mock schema validation success
      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAssignmentInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createAssignment(validAssignmentInput as any);

      expect(mockAssignmentSchema.safeParse).toHaveBeenCalledWith(validAssignmentInput);
      expect(mockFrom).toHaveBeenCalledWith('assignment');
      expect(mockInsert).toHaveBeenCalledWith([validAssignmentInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        branch_id: '', // Invalid: empty branch_id
        points: -10, // Invalid: negative points
      };

      const mockErrors = [
        {
          path: ['branch_id'],
          message: 'Branch ID is required',
        },
        {
          path: ['beneficiary_id'],
          message: 'Beneficiary ID is required',
        },
        {
          path: ['points'],
          message: 'Points must be a positive number',
        },
      ];

      // Mock schema validation failure
      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAssignment(invalidInput as any);

      expect(mockAssignmentSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            branch_id: 'Branch ID is required',
            beneficiary_id: 'Beneficiary ID is required',
            points: 'Points must be a positive number',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAssignmentInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createAssignment(validAssignmentInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should handle validation errors with multiple fields', async () => {
      const invalidInput = {
        branch_id: '',
        points: 'invalid', // Invalid type
        assignment_date: 'bad-date',
      };

      const mockErrors = [
        { path: ['branch_id'], message: 'Branch ID is required' },
        { path: ['points'], message: 'Points must be a number' },
        { path: ['assignment_date'], message: 'Invalid date format' },
      ];

      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAssignment(invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            branch_id: 'Branch ID is required',
            points: 'Points must be a number',
            assignment_date: 'Invalid date format',
          },
        },
      });
    });

    it('should handle validation errors with empty path', async () => {
      const mockErrors = [
        { path: [], message: 'General validation error' },
        { path: ['points'], message: 'Points are required' },
      ];

      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAssignment({} as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            points: 'Points are required',
          },
        },
      });
    });

  })

  describe('updateAssignment', () => {
    const assignmentId = 'assign-123';
    const validUpdateInput = {
      branch_id: 'branch-456',
      beneficiary_id: 'ben-789',
      user_id: 'user-102',
      points: 75,
      reason: 'Updated bonus',
      assignment_date: '2024-01-02T00:00:00Z',
      observations: 'Updated observations',
    };

    it('should update assignment successfully', async () => {
      const mockUpdatedData = { id: assignmentId, ...validUpdateInput };

      // Mock schema validation success
      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateAssignment(assignmentId, validUpdateInput as any);

      expect(mockAssignmentSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('assignment');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', assignmentId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        points: -10, // Invalid: negative points
        assignment_date: 'invalid-date', // Invalid date format
      };

      const mockErrors = [
        { path: ['points'], message: 'Points cannot be negative' },
        { path: ['assignment_date'], message: 'Invalid date format' },
      ];

      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateAssignment(assignmentId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            points: 'Points cannot be negative',
            assignment_date: 'Invalid date format',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockAssignmentSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateAssignment(assignmentId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

  })

  describe('deleteAssignment', () => {
    it('should delete assignment successfully', async () => {
      const assignmentId = 'assign-123';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteAssignment(assignmentId);

      expect(mockFrom).toHaveBeenCalledWith('assignment');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', assignmentId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const assignmentId = 'assign-123';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteAssignment(assignmentId);

      expect(result).toEqual({ error: mockDatabaseError });
    });

  });
});