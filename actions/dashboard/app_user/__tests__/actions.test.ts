import { 
  createAppUser, 
  updateAppUser, 
  deleteAppUser, 
  getAppUsers, 
  getAppUser 
} from '../actions';
import { createClient } from '@/lib/supabase/server';
import { AppUserSchema } from '@/schemas/app_user.schema';

// Mock the supabase server client
jest.mock('@/lib/supabase/server');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock the schema
jest.mock('@/schemas/app_user.schema');
const mockAppUserSchema = AppUserSchema as jest.Mocked<typeof AppUserSchema>;

describe('AppUser Actions', () => {
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

  describe('createAppUser', () => {
    const validAppUserInput = {
      organization_id: 'org-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: 'securepassword123',
      active: true,
    };

    it('should create app user successfully with valid input', async () => {
      const mockData = { id: '1', ...validAppUserInput };
      
      // Mock schema validation success
      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAppUserInput,
      });

      // Mock successful database insertion
      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createAppUser(validAppUserInput as any);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith(validAppUserInput);
      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockInsert).toHaveBeenCalledWith([validAppUserInput]);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should create app user with minimal required fields', async () => {
      const minimalInput = {
        organization_id: 'org-1',
        active: true,
      };

      const mockData = { id: '1', ...minimalInput };

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: minimalInput,
      });

      mockSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await createAppUser(minimalInput as any);

      expect(result).toEqual({ data: mockData, error: null });
    });

    it('should return validation errors for invalid input', async () => {
      const invalidInput = {
        organization_id: '', // Invalid: empty organization_id
        email: 'invalid-email', // Invalid email format
      };

      const mockErrors = [
        {
          path: ['organization_id'],
          message: 'Organization ID is required',
        },
        {
          path: ['email'],
          message: 'Invalid email format',
        },
      ];

      // Mock schema validation failure
      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAppUser(invalidInput as any);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith(invalidInput);
      expect(mockFrom).not.toHaveBeenCalled();
      expect(result).toEqual({
        error: {
          fieldErrors: {
            organization_id: 'Organization ID is required',
            email: 'Invalid email format',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockDatabaseError = { message: 'Database connection failed' };

      // Mock schema validation success
      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validAppUserInput,
      });

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await createAppUser(validAppUserInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should handle validation errors with multiple fields', async () => {
      const invalidInput = {
        organization_id: '',
        first_name: 123, // Invalid type
        email: 'not-an-email',
      };

      const mockErrors = [
        { path: ['organization_id'], message: 'Organization ID is required' },
        { path: ['first_name'], message: 'First name must be a string or null' },
        { path: ['email'], message: 'Invalid email format' },
      ];

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAppUser(invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            organization_id: 'Organization ID is required',
            first_name: 'First name must be a string or null',
            email: 'Invalid email format',
          },
        },
      });
    });

    it('should handle validation errors with empty path', async () => {
      const mockErrors = [
        { path: [], message: 'General validation error' },
        { path: ['organization_id'], message: 'Organization ID is required' },
      ];

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await createAppUser({} as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            organization_id: 'Organization ID is required',
          },
        },
      });
    });
  });

  describe('updateAppUser', () => {
    const userId = 'user-1';
    const validUpdateInput = {
      organization_id: 'org-2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      username: 'janesmith',
      active: false,
    };

    it('should update app user successfully', async () => {
      const mockUpdatedData = { id: userId, ...validUpdateInput };

      // Mock schema validation success
      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      // Mock successful database update
      mockSingle.mockResolvedValue({
        data: mockUpdatedData,
        error: null,
      });

      const result = await updateAppUser(userId, validUpdateInput as any);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith(validUpdateInput);
      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockUpdate).toHaveBeenCalledWith(validUpdateInput);
      expect(mockEq).toHaveBeenCalledWith('id', userId);
      expect(result).toEqual({ data: mockUpdatedData, error: null });
    });

    it('should return validation errors for invalid update input', async () => {
      const invalidInput = {
        organization_id: '',
        email: 'invalid-email-format',
        active: 'not-boolean', // Invalid type
      };

      const mockErrors = [
        { path: ['organization_id'], message: 'Organization ID is required' },
        { path: ['email'], message: 'Invalid email format' },
        { path: ['active'], message: 'Active must be a boolean' },
      ];

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: false,
        error: {
          issues: mockErrors,
        },
      });

      const result = await updateAppUser(userId, invalidInput as any);

      expect(result).toEqual({
        error: {
          fieldErrors: {
            organization_id: 'Organization ID is required',
            email: 'Invalid email format',
            active: 'Active must be a boolean',
          },
        },
      });
    });

    it('should handle database errors during update', async () => {
      const mockDatabaseError = { message: 'Update failed' };

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: validUpdateInput,
      });

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await updateAppUser(userId, validUpdateInput as any);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('deleteAppUser', () => {
    it('should delete app user successfully', async () => {
      const userId = 'user-1';

      mockEq.mockResolvedValue({
        error: null,
      });

      const result = await deleteAppUser(userId);

      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', userId);
      expect(result).toEqual({ error: null });
    });

    it('should handle database errors during deletion', async () => {
      const userId = 'user-1';
      const mockDatabaseError = { message: 'Delete failed' };

      mockEq.mockResolvedValue({
        error: mockDatabaseError,
      });

      const result = await deleteAppUser(userId);

      expect(result).toEqual({ error: mockDatabaseError });
    });
  });

  describe('getAppUsers', () => {
    it('should fetch all app users successfully with organization data', async () => {
      const mockUsers = [
        { 
          id: '1', 
          first_name: 'John', 
          last_name: 'Doe',
          email: 'john@example.com',
          organization: { name: 'Organization 1' },
          active: true 
        },
        { 
          id: '2', 
          first_name: 'Jane', 
          last_name: 'Smith',
          email: 'jane@example.com',
          organization: { name: 'Organization 2' },
          active: false 
        },
      ];

      mockOrder.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await getAppUsers();

      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockSelect).toHaveBeenCalledWith(`
      *,
      organization:organization(name)
    `);
      expect(mockOrder).toHaveBeenCalledWith('first_name', { nullsFirst: false });
      expect(result).toEqual({ data: mockUsers, error: null });
    });

    it('should handle database errors when fetching users', async () => {
      const mockDatabaseError = { message: 'Fetch failed' };

      mockOrder.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getAppUsers();

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });

    it('should return empty array when no users exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getAppUsers();

      expect(result).toEqual({ data: [], error: null });
    });

    it('should handle users with null first_name correctly with sorting', async () => {
      const mockUsers = [
        { id: '1', first_name: 'Alice', last_name: 'Johnson' },
        { id: '2', first_name: null, last_name: 'Smith' },
        { id: '3', first_name: 'Bob', last_name: 'Wilson' },
      ];

      mockOrder.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const result = await getAppUsers();

      expect(mockOrder).toHaveBeenCalledWith('first_name', { nullsFirst: false });
      expect(result.data).toEqual(mockUsers);
    });
  });

  describe('getAppUser', () => {
    it('should fetch single app user successfully', async () => {
      const userId = 'user-1';
      const mockUser = { 
        id: userId, 
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        username: 'johndoe',
        active: true 
      };

      mockSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await getAppUser(userId);

      expect(mockFrom).toHaveBeenCalledWith('app_user');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', userId);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual({ data: mockUser, error: null });
    });

    it('should handle app user not found', async () => {
      const userId = 'non-existent';

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      const result = await getAppUser(userId);

      expect(result).toEqual({ data: null, error: { message: 'User not found' } });
    });

    it('should handle database errors when fetching single user', async () => {
      const userId = 'user-1';
      const mockDatabaseError = { message: 'Database connection failed' };

      mockSingle.mockResolvedValue({
        data: null,
        error: mockDatabaseError,
      });

      const result = await getAppUser(userId);

      expect(result).toEqual({ data: null, error: mockDatabaseError });
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle special characters in user data', async () => {
      const specialCharInput = {
        organization_id: 'org-special-chars',
        first_name: 'José María',
        last_name: 'O\'Connor-Smith',
        email: 'jose.maria+test@example-domain.com',
        username: 'jose_maria.123',
        active: true,
      };

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: specialCharInput,
      });

      mockSingle.mockResolvedValue({
        data: { id: '1', ...specialCharInput },
        error: null,
      });

      const result = await createAppUser(specialCharInput as any);

      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should handle empty strings vs null values', async () => {
      const emptyStringInput = {
        organization_id: 'org-1',
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: '',
        active: false,
      };

      mockAppUserSchema.safeParse = jest.fn().mockReturnValue({
        success: true,
        data: emptyStringInput,
      });

      mockSingle.mockResolvedValue({
        data: { id: '1', ...emptyStringInput },
        error: null,
      });

      const result = await createAppUser(emptyStringInput as any);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith(emptyStringInput);
      expect(result.data).toBeTruthy();
    });

    it('should handle concurrent operations', async () => {
      const user1 = { organization_id: 'org-1', first_name: 'User1', active: true };
      const user2 = { organization_id: 'org-1', first_name: 'User2', active: true };

      mockAppUserSchema.safeParse = jest.fn()
        .mockReturnValueOnce({ success: true, data: user1 })
        .mockReturnValueOnce({ success: true, data: user2 });

      mockSingle
        .mockResolvedValueOnce({ data: { id: '1', ...user1 }, error: null })
        .mockResolvedValueOnce({ data: { id: '2', ...user2 }, error: null });

      const [result1, result2] = await Promise.all([
        createAppUser(user1 as any),
        createAppUser(user2 as any),
      ]);

      expect(result1.data.id).toBe('1');
      expect(result2.data.id).toBe('2');
    });
  });
});