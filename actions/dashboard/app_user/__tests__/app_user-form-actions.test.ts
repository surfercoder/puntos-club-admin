import { appUserFormAction } from '../app_user-form-actions';
import { createAppUser, updateAppUser } from '../actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

// Mock the actions
jest.mock('../actions');
const mockCreateAppUser = createAppUser as jest.MockedFunction<typeof createAppUser>;
const mockUpdateAppUser = updateAppUser as jest.MockedFunction<typeof updateAppUser>;

describe('appUserFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new app user', () => {
    beforeEach(() => {
      formData.append('organization_id', 'org-1');
      formData.append('first_name', 'John');
      formData.append('last_name', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('username', 'johndoe');
      formData.append('password', 'securepassword123');
      formData.append('active', 'on'); // checkbox is 'on' when checked
    });

    it('should create app user successfully', async () => {
      const mockCreatedUser = {
        id: '1',
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'securepassword123',
        active: true,
      };

      mockCreateAppUser.mockResolvedValue({
        data: mockCreatedUser,
        error: null,
      });

      const result = await appUserFormAction(prevState, formData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'securepassword123',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'User created successfully!',
      });
    });

    it('should handle creation with null optional fields', async () => {
      const formDataMinimal = new FormData();
      formDataMinimal.append('organization_id', 'org-1');
      formDataMinimal.append('active', 'on');

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1', organization_id: 'org-1', active: true },
        error: null,
      });

      const result = await appUserFormAction(prevState, formDataMinimal);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: null,
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: true,
      });

      expect(result.message).toBe('User created successfully!');
    });

    it('should handle unchecked active checkbox', async () => {
      const formDataInactive = new FormData();
      formDataInactive.append('organization_id', 'org-1');
      formDataInactive.append('first_name', 'Jane');
      formDataInactive.append('last_name', 'Smith');
      formDataInactive.append('email', 'jane.smith@example.com');
      // No 'active' field means checkbox is unchecked

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1', first_name: 'Jane', active: false },
        error: null,
      });

      const result = await appUserFormAction(prevState, formDataInactive);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: null,
        password: null,
        active: false,
      });
    });

    it('should handle empty string fields conversion to null', async () => {
      const formDataWithEmptyStrings = new FormData();
      formDataWithEmptyStrings.append('organization_id', 'org-1');
      formDataWithEmptyStrings.append('first_name', ''); // Empty string should become null
      formDataWithEmptyStrings.append('last_name', '');
      formDataWithEmptyStrings.append('email', '');
      formDataWithEmptyStrings.append('username', '');
      formDataWithEmptyStrings.append('password', '');
      formDataWithEmptyStrings.append('active', 'on');

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1', organization_id: 'org-1', active: true },
        error: null,
      });

      const result = await appUserFormAction(prevState, formDataWithEmptyStrings);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: null,
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: true,
      });

      expect(result.message).toBe('User created successfully!');
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateAppUser.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            organization_id: 'Organization is required',
            email: 'Invalid email format',
            username: 'Username already exists',
          },
        },
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          organization_id: ['Organization is required'],
          email: ['Invalid email format'],
          username: ['Username already exists'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateAppUser.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the user.',
      });
    });
  });

  describe('updating existing app user', () => {
    const userId = 'user-1';

    beforeEach(() => {
      formData.append('id', userId);
      formData.append('organization_id', 'org-2');
      formData.append('first_name', 'Jane');
      formData.append('last_name', 'Smith');
      formData.append('email', 'jane.smith@example.com');
      formData.append('username', 'janesmith');
      formData.append('password', 'newpassword456');
      formData.append('active', 'on');
    });

    it('should update app user successfully', async () => {
      const mockUpdatedUser = {
        id: userId,
        organization_id: 'org-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'newpassword456',
        active: true,
      };

      mockUpdateAppUser.mockResolvedValue({
        data: mockUpdatedUser,
        error: null,
      });

      const result = await appUserFormAction(prevState, formData);

      expect(mockUpdateAppUser).toHaveBeenCalledWith(userId, {
        organization_id: 'org-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'newpassword456',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'User updated successfully!',
      });
    });

    it('should handle update with partial data', async () => {
      const formDataPartial = new FormData();
      formDataPartial.append('id', userId);
      formDataPartial.append('organization_id', 'org-2');
      formDataPartial.append('first_name', 'UpdatedName');
      // Other fields missing - should become null

      mockUpdateAppUser.mockResolvedValue({
        data: { id: userId, first_name: 'UpdatedName' },
        error: null,
      });

      const result = await appUserFormAction(prevState, formDataPartial);

      expect(mockUpdateAppUser).toHaveBeenCalledWith(userId, {
        organization_id: 'org-2',
        first_name: 'UpdatedName',
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: false, // Checkbox not checked
      });

      expect(result.message).toBe('User updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateAppUser.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            email: 'Email is already in use',
            username: 'Username cannot be empty',
          },
        },
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          email: ['Email is already in use'],
          username: ['Username cannot be empty'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateAppUser.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the user.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await appUserFormAction(prevState, emptyFormData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: null, // Missing fields become null
        first_name: null,
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: false,
      });
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('organization_id', '  org-1  ');
      formData.append('first_name', '  John  ');
      formData.append('last_name', '  Doe  ');
      formData.append('email', '  john.doe@example.com  ');
      formData.append('username', '  johndoe  ');
      formData.append('password', '  password123  ');

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await appUserFormAction(prevState, formData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: '  org-1  ', // Whitespace is preserved
        first_name: '  John  ',
        last_name: '  Doe  ',
        email: '  john.doe@example.com  ',
        username: '  johndoe  ',
        password: '  password123  ',
        active: false,
      });
    });

    it('should handle checkbox variations', async () => {
      // Test different checkbox values
      const testCases = [
        { value: 'on', expected: true },
        { value: 'true', expected: false }, // Only 'on' is truthy for checkboxes
        { value: '1', expected: false },
        { value: '', expected: false },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('organization_id', 'org-1');
        testFormData.append('first_name', 'Test');
        testFormData.append('active', testCase.value);

        mockCreateAppUser.mockClear();
        mockCreateAppUser.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await appUserFormAction(prevState, testFormData);

        expect(mockCreateAppUser).toHaveBeenCalledWith({
          organization_id: 'org-1',
          first_name: 'Test',
          last_name: null,
          email: null,
          username: null,
          password: null,
          active: testCase.expected,
        });
      }
    });

    it('should handle special characters in form data', async () => {
      const specialFormData = new FormData();
      specialFormData.append('organization_id', 'org-special-éñ');
      specialFormData.append('first_name', 'José María');
      specialFormData.append('last_name', 'O\'Connor-Smith');
      specialFormData.append('email', 'jose.maria+test@example-domain.com');
      specialFormData.append('username', 'jose_maria.123');
      specialFormData.append('password', 'P@ssw0rd!@#$%^&*()');
      specialFormData.append('active', 'on');

      mockCreateAppUser.mockResolvedValue({
        data: { id: '1', first_name: 'José María' },
        error: null,
      });

      const result = await appUserFormAction(prevState, specialFormData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'org-special-éñ',
        first_name: 'José María',
        last_name: 'O\'Connor-Smith',
        email: 'jose.maria+test@example-domain.com',
        username: 'jose_maria.123',
        password: 'P@ssw0rd!@#$%^&*()',
        active: true,
      });

      expect(result.message).toBe('User created successfully!');
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('organization_id', 'org-1');
      formData.append('first_name', 'Test User');
    });

    it('should handle undefined error object', async () => {
      mockCreateAppUser.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the user.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateAppUser.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the user.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateAppUser.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            email: 'Single string error',
            username: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await appUserFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        email: ['Single string error'],
        username: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateAppUser.mockRejectedValue(new Error('Network error'));

      formData.append('organization_id', 'org-1');
      formData.append('first_name', 'Test User');

      await expect(appUserFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', first_name: 'Test User' },
            error: null,
          });
        }, 100);
      });

      mockCreateAppUser.mockReturnValue(slowResponse as any);

      formData.append('organization_id', 'org-1');
      formData.append('first_name', 'Test User');

      const result = await appUserFormAction(prevState, formData);

      expect(result.message).toBe('User created successfully!');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user creation workflow', async () => {
      // Full user with all fields
      const completeFormData = new FormData();
      completeFormData.append('organization_id', 'enterprise-org-123');
      completeFormData.append('first_name', 'John');
      completeFormData.append('last_name', 'Doe');
      completeFormData.append('email', 'john.doe@enterprise.com');
      completeFormData.append('username', 'jdoe');
      completeFormData.append('password', 'SecurePassword123!');
      completeFormData.append('active', 'on');

      const expectedUser = {
        id: 'user-xyz-123',
        organization_id: 'enterprise-org-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@enterprise.com',
        username: 'jdoe',
        password: 'SecurePassword123!',
        active: true,
      };

      mockCreateAppUser.mockResolvedValue({
        data: expectedUser,
        error: null,
      });

      const result = await appUserFormAction(prevState, completeFormData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'enterprise-org-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@enterprise.com',
        username: 'jdoe',
        password: 'SecurePassword123!',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'User created successfully!',
      });
    });

    it('should handle user update workflow with password change', async () => {
      const userId = 'existing-user-123';
      const updateFormData = new FormData();
      updateFormData.append('id', userId);
      updateFormData.append('organization_id', 'enterprise-org-123');
      updateFormData.append('first_name', 'John');
      updateFormData.append('last_name', 'Doe-Smith'); // Updated name
      updateFormData.append('email', 'john.doe-smith@enterprise.com'); // Updated email
      updateFormData.append('username', 'jdsmith'); // Updated username
      updateFormData.append('password', 'NewSecurePassword456!'); // New password
      // No active field - should be false

      mockUpdateAppUser.mockResolvedValue({
        data: { id: userId, last_name: 'Doe-Smith' },
        error: null,
      });

      const result = await appUserFormAction(prevState, updateFormData);

      expect(mockUpdateAppUser).toHaveBeenCalledWith(userId, {
        organization_id: 'enterprise-org-123',
        first_name: 'John',
        last_name: 'Doe-Smith',
        email: 'john.doe-smith@enterprise.com',
        username: 'jdsmith',
        password: 'NewSecurePassword456!',
        active: false, // Checkbox not checked
      });

      expect(result.message).toBe('User updated successfully!');
    });

    it('should handle user creation with minimal data', async () => {
      const minimalFormData = new FormData();
      minimalFormData.append('organization_id', 'basic-org');
      minimalFormData.append('active', 'on');

      mockCreateAppUser.mockResolvedValue({
        data: { id: 'min-user-1', organization_id: 'basic-org', active: true },
        error: null,
      });

      const result = await appUserFormAction(prevState, minimalFormData);

      expect(mockCreateAppUser).toHaveBeenCalledWith({
        organization_id: 'basic-org',
        first_name: null,
        last_name: null,
        email: null,
        username: null,
        password: null,
        active: true,
      });

      expect(result.message).toBe('User created successfully!');
    });
  });
});