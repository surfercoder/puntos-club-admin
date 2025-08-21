import { createClient } from '@/lib/supabase/server';
import { StatusSchema } from '@/schemas/status.schema';

import { 
  createStatus, 
  updateStatus, 
  deleteStatus, 
  getStatuses, 
  getStatus 
} from '../actions';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/status.schema');
const mockStatusSchema = StatusSchema as jest.Mocked<typeof StatusSchema>;

describe('Status Actions', () => {
  let mockSupabaseClient: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
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
    mockOrder = jest.fn();
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
      order: mockOrder,
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

    mockOrder.mockReturnValue({
      data: [],
      error: null,
    });

    mockSingle.mockReturnValue({
      data: null,
      error: null,
    });
  });

  describe('createStatus', () => {
    const validStatusInput = {
      name: 'Active',
      order_num: 1,
    };

    it('should create status successfully with valid input', async () => {
      const mockData = { id: '1', ...validStatusInput };
      
      // Mock schema validation success
      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validStatusInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createStatus(validStatusInput as any);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith(validStatusInput);
      expect(mockFrom).toHaveBeenCalledWith('status');
      expect(mockInsert).toHaveBeenCalledWith([validStatusInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        name: '', // Invalid: empty name
        order_num: -1, // Invalid: negative order
      };

      const mockErrors = [
        {
          path: ['name'],
          message: 'Name is required',
        },
        {
          path: ['order_num'],
          message: 'Order must be positive',
        },
      ];

      // Mock schema validation failure
      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createStatus(invalidInput as any);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            order_num: 'Order must be positive',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validStatusInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createStatus(validStatusInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('updateStatus', () => {
    const statusId = 'status-1';
    const validUpdateInput = {
      name: 'Updated Status',
      order_num: 2,
    };

    it('should update status successfully', async () => {
      const mockUpdatedData = { id: statusId, ...validUpdateInput };

      // Mock schema validation success
      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateStatus(statusId, validUpdateInput as any);

      expect(mockStatusSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('status');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', statusId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        name: '',
        order_num: 'invalid', // Invalid type
      };

      const mockErrors = [
        { path: ['name'], message: 'Name is required' },
        { path: ['order_num'], message: 'Order must be a number' },
      ];

      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateStatus(statusId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            order_num: 'Order must be a number',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockStatusSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateStatus(statusId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('deleteStatus', () => {
    it('should delete status successfully', async () => {
      const statusId = 'status-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteStatus(statusId);

      expect(mockFrom).toHaveBeenCalledWith('status');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', statusId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const statusId = 'status-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteStatus(statusId);

      expect(result).toEqual({ error: mockDatabaseError });
    });
  });

  describe('getStatuses', () => {
    it('should fetch all statuses successfully', async () => {
      const mockStatuses = [
        { id: '1', name: 'Active', order_num: 1 },
        { id: '2', name: 'Inactive', order_num: 2 },
      ];

      mockOrder.mockResolvedValue({
        data: mockStatuses,
        error: null,
      });

      const result = await getStatuses();

      expect(mockFrom).toHaveBeenCalledWith('status');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('order_num');
      expect(result).toEqual({ data: mockStatuses, error: null });
    });

    it('should handle database errors when fetching statuses', async () => {
      const mockDatabaseError = { message: 'Fetch failed' };

      mockOrder.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getStatuses();

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should return empty array when no statuses exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getStatuses();

      expect(result).toEqual({ data: [], error: null });
    });
  });

  describe('getStatus', () => {
    it('should fetch single status successfully', async () => {
      const statusId = 'status-1';
      const mockStatus = { 
        id: statusId, 
        name: 'Active', 
        order_num: 1
      };

      mockSingle.mockResolvedValue({
        data: mockStatus,
        error: null,
      });

      const result = await getStatus(statusId);

      expect(mockFrom).toHaveBeenCalledWith('status');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', statusId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockStatus, error: null });
    });

    it('should handle status not found', async () => {
      const statusId = 'non-existent';

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Status not found' },
      });

      const result = await getStatus(statusId);

      expect(result).toEqual({ data: null, error: { message: 'Status not found' } });
    });

    it('should handle database errors when fetching single status', async () => {
      const statusId = 'status-1';
      const mockDatabaseError = { message: 'Database connection failed' };

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getStatus(statusId);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });
});