import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';
import { AppUserSchema } from '@/schemas/app_user.schema';

import { createAppUser, updateAppUser } from '../actions';
import { appUserFormAction } from '../app_user-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/app_user.schema', () => ({
  AppUserSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateAppUser = createAppUser as jest.MockedFunction<typeof createAppUser>;
const mockUpdateAppUser = updateAppUser as jest.MockedFunction<typeof updateAppUser>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockAppUserSchema = AppUserSchema as jest.Mocked<typeof AppUserSchema>;

describe('appUserFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
      const parsedData = {
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'securepassword123',
        active: true, // Schema converts 'on' to boolean
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await appUserFormAction(prevState, formData);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        password: 'securepassword123',
        active: 'on',
      });
      expect(mockCreateAppUser).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/app_user');
      expect(mockToActionState).toHaveBeenCalledWith('App User created successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle unchecked active checkbox', async () => {
      const formDataInactive = new FormData();
      formDataInactive.append('organization_id', 'org-1');
      formDataInactive.append('first_name', 'Jane');
      formDataInactive.append('last_name', 'Smith');
      formDataInactive.append('email', 'jane.smith@example.com');
      // No 'active' field means checkbox is unchecked

      const parsedData = {
        organization_id: 'org-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        active: false, // Schema default
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await appUserFormAction(prevState, formDataInactive);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
      });
      expect(mockCreateAppUser).toHaveBeenCalledWith(parsedData);
      expect(result).toEqual(successActionState);
    });

    it('should handle schema validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['organization_id'], message: 'Organization is required' },
          { path: ['email'], message: 'Invalid email format' },
          { path: ['username'], message: 'Username already exists' },
        ],
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          organization_id: ['Organization is required'],
          email: ['Invalid email format'],
          username: ['Username already exists'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await appUserFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });

    it('should handle runtime errors', async () => {
      const parsedData = {
        organization_id: 'org-1',
        first_name: 'John',
        active: true,
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const runtimeError = new Error('Database connection failed');
      mockCreateAppUser.mockRejectedValue(runtimeError);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the app user.',
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await appUserFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(runtimeError);
      expect(result).toEqual(errorActionState);
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
      const parsedData = {
        id: userId,
        organization_id: 'org-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'newpassword456',
        active: true,
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User updated successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await appUserFormAction(prevState, formData);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({
        id: userId,
        organization_id: 'org-2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        password: 'newpassword456',
        active: 'on',
      });
      expect(mockUpdateAppUser).toHaveBeenCalledWith(userId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/app_user');
      expect(mockToActionState).toHaveBeenCalledWith('App User updated successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle update validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['email'], message: 'Email is already in use' },
          { path: ['username'], message: 'Username cannot be empty' },
        ],
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          email: ['Email is already in use'],
          username: ['Username cannot be empty'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await appUserFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });
  });

  describe('form data processing', () => {
    it('should handle Object.fromEntries with empty form data', async () => {
      const emptyFormData = new FormData();

      const parsedData = {
        organization_id: '',
        active: true, // Schema default for active
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await appUserFormAction(prevState, emptyFormData);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({});
    });

    it('should handle form data conversion correctly', async () => {
      const testFormData = new FormData();
      testFormData.append('organization_id', 'org-1');
      testFormData.append('first_name', 'Test');
      testFormData.append('active', 'on'); // checkbox value

      const parsedData = {
        organization_id: 'org-1',
        first_name: 'Test',
        active: true, // Schema converts 'on' to boolean
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await appUserFormAction(prevState, testFormData);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-1',
        first_name: 'Test',
        active: 'on',
      });
      expect(mockCreateAppUser).toHaveBeenCalledWith(parsedData);
    });

    it('should handle special characters in form data', async () => {
      const specialFormData = new FormData();
      specialFormData.append('organization_id', 'org-special-éñ');
      specialFormData.append('first_name', 'José María');
      specialFormData.append('email', 'jose.maria+test@example-domain.com');

      const parsedData = {
        organization_id: 'org-special-éñ',
        first_name: 'José María',
        email: 'jose.maria+test@example-domain.com',
        active: true,
      };

      mockAppUserSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'App User created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await appUserFormAction(prevState, specialFormData);

      expect(mockAppUserSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-special-éñ',
        first_name: 'José María',
        email: 'jose.maria+test@example-domain.com',
      });
      expect(result).toEqual(successActionState);
    });
  });
});