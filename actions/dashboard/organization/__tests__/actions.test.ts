import { createClient } from '@/lib/supabase/server';
import { OrganizationSchema } from '@/schemas/organization.schema';

import { 
  createOrganization, 
  updateOrganization, 
  deleteOrganization, 
  getOrganizations, 
  getOrganization 
} from '../actions';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/organization.schema');
const mockOrganizationSchema = OrganizationSchema as jest.Mocked<typeof OrganizationSchema>;

describe('Organization Actions', () => {
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

  describe('createOrganization', () => {
    const validOrganizationInput = {
      name: 'Test Org',
      description: 'Test Description',
    };

    it('should create organization successfully with valid input', async () => {
      const mockData = { id: '1', ...validOrganizationInput };
      
      // Mock schema validation success
      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validOrganizationInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createOrganization(validOrganizationInput as any);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith(validOrganizationInput);
      expect(mockFrom).toHaveBeenCalledWith('organization');
      expect(mockInsert).toHaveBeenCalledWith([validOrganizationInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        name: '', // Invalid: empty name
        description: '', // Invalid: empty description
      };

      const mockErrors = [
        {
          path: ['name'],
          message: 'Name is required',
        },
        {
          path: ['description'],
          message: 'Description is required',
        },
      ];

      // Mock schema validation failure
      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createOrganization(invalidInput as any);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            description: 'Description is required',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validOrganizationInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createOrganization(validOrganizationInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('updateOrganization', () => {
    const organizationId = 'org-1';
    const validUpdateInput = {
      name: 'Updated Org',
      description: 'Updated Description',
    };

    it('should update organization successfully', async () => {
      const mockUpdatedData = { id: organizationId, ...validUpdateInput };

      // Mock schema validation success
      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateOrganization(organizationId, validUpdateInput as any);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('organization');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', organizationId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        name: '',
        description: 'invalid', // Invalid input
      };

      const mockErrors = [
        { path: ['name'], message: 'Name is required' },
        { path: ['description'], message: 'Description must be valid' },
      ];

      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateOrganization(organizationId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            name: 'Name is required',
            description: 'Description must be valid',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockOrganizationSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateOrganization(organizationId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      const organizationId = 'org-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteOrganization(organizationId);

      expect(mockFrom).toHaveBeenCalledWith('organization');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', organizationId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const organizationId = 'org-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteOrganization(organizationId);

      expect(result).toEqual({ error: mockDatabaseError });
    });
  });

  describe('getOrganizations', () => {
    it('should fetch all organizations successfully', async () => {
      const mockOrganizations = [
        { id: '1', name: 'Organization 1', description: 'Description 1' },
        { id: '2', name: 'Organization 2', description: 'Description 2' },
      ];

      mockOrder.mockResolvedValue({
        data: mockOrganizations,
        error: null,
      });

      const result = await getOrganizations();

      expect(mockFrom).toHaveBeenCalledWith('organization');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOrder).toHaveBeenCalledWith('name');
      expect(result).toEqual({ data: mockOrganizations, error: null });
    });

    it('should handle database errors when fetching organizations', async () => {
      const mockDatabaseError = { message: 'Fetch failed' };

      mockOrder.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getOrganizations();

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should return empty array when no organizations exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getOrganizations();

      expect(result).toEqual({ data: [], error: null });
    });
  });

  describe('getOrganization', () => {
    it('should fetch single organization successfully', async () => {
      const organizationId = 'org-1';
      const mockOrganization = { 
        id: organizationId, 
        name: 'Test Organization', 
        description: 'Test Description'
      };

      mockSingle.mockResolvedValue({
        data: mockOrganization,
        error: null,
      });

      const result = await getOrganization(organizationId);

      expect(mockFrom).toHaveBeenCalledWith('organization');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', organizationId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockOrganization, error: null });
    });

    it('should handle organization not found', async () => {
      const organizationId = 'non-existent';

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Organization not found' },
      });

      const result = await getOrganization(organizationId);

      expect(result).toEqual({ data: null, error: { message: 'Organization not found' } });
    });

    it('should handle database errors when fetching single organization', async () => {
      const organizationId = 'org-1';
      const mockDatabaseError = { message: 'Database connection failed' };

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getOrganization(organizationId);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });
});