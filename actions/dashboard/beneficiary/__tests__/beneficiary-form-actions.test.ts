import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';

import { createBeneficiary, updateBeneficiary } from '../actions';
import { beneficiaryFormAction } from '../beneficiary-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/beneficiary.schema', () => ({
  BeneficiarySchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateBeneficiary = createBeneficiary as jest.MockedFunction<typeof createBeneficiary>;
const mockUpdateBeneficiary = updateBeneficiary as jest.MockedFunction<typeof updateBeneficiary>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockBeneficiarySchema = BeneficiarySchema as jest.Mocked<typeof BeneficiarySchema>;

describe('beneficiaryFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new beneficiary', () => {
    beforeEach(() => {
      formData.append('first_name', 'John');
      formData.append('last_name', 'Doe');
      formData.append('email', 'john.doe@example.com');
      formData.append('phone', '+1234567890');
      formData.append('document_id', '12345678');
      formData.append('available_points', '100');
    });

    it('should create beneficiary successfully', async () => {
      const parsedData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        document_id: '12345678',
        available_points: 100, // Schema converts to number
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        document_id: '12345678',
        available_points: '100',
      });
      expect(mockCreateBeneficiary).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/beneficiary');
      expect(mockToActionState).toHaveBeenCalledWith('Beneficiary created successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle schema validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['phone'], message: 'Invalid phone format' },
          { path: ['document_id'], message: 'Document ID already exists' },
        ],
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          email: ['Invalid email format'],
          phone: ['Invalid phone format'],
          document_id: ['Document ID already exists'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });

    it('should handle runtime errors', async () => {
      const parsedData = {
        first_name: 'John',
        available_points: 100,
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const runtimeError = new Error('Database connection failed');
      mockCreateBeneficiary.mockRejectedValue(runtimeError);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the beneficiary.',
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(runtimeError);
      expect(result).toEqual(errorActionState);
    });
  });

  describe('updating existing beneficiary', () => {
    const beneficiaryId = 'beneficiary-1';

    beforeEach(() => {
      formData.append('id', beneficiaryId);
      formData.append('first_name', 'Jane');
      formData.append('last_name', 'Smith');
      formData.append('email', 'jane.smith@example.com');
      formData.append('phone', '+9876543210');
      formData.append('document_id', '87654321');
      formData.append('available_points', '200');
    });

    it('should update beneficiary successfully', async () => {
      const parsedData = {
        id: beneficiaryId,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
        document_id: '87654321',
        available_points: 200, // Schema converts to number
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary updated successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith({
        id: beneficiaryId,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
        document_id: '87654321',
        available_points: '200',
      });
      expect(mockUpdateBeneficiary).toHaveBeenCalledWith(beneficiaryId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/beneficiary');
      expect(mockToActionState).toHaveBeenCalledWith('Beneficiary updated successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle update validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['first_name'], message: 'First name is required' },
          { path: ['email'], message: 'Email already exists' },
        ],
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          first_name: ['First name is required'],
          email: ['Email already exists'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });
  });

  describe('form data processing', () => {
    it('should handle Object.fromEntries with empty form data', async () => {
      const emptyFormData = new FormData();

      const parsedData = {
        available_points: 0, // Schema default for available_points
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await beneficiaryFormAction(prevState, emptyFormData);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith({});
    });

    it('should handle form data conversion correctly', async () => {
      const testFormData = new FormData();
      testFormData.append('first_name', 'Jane');
      testFormData.append('email', 'jane@example.com');
      testFormData.append('available_points', '50');

      const parsedData = {
        first_name: 'Jane',
        email: 'jane@example.com',
        available_points: 50, // Schema converts string to number
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await beneficiaryFormAction(prevState, testFormData);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith({
        first_name: 'Jane',
        email: 'jane@example.com',
        available_points: '50',
      });
      expect(mockCreateBeneficiary).toHaveBeenCalledWith(parsedData);
    });

    it('should handle invalid available_points processing', async () => {
      const testFormData = new FormData();
      testFormData.append('first_name', 'John');
      testFormData.append('available_points', 'invalid-number');

      const parsedData = {
        first_name: 'John',
        available_points: 0, // Schema converts invalid string to 0
      };

      mockBeneficiarySchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await beneficiaryFormAction(prevState, testFormData);

      expect(mockBeneficiarySchema.safeParse).toHaveBeenCalledWith({
        first_name: 'John',
        available_points: 'invalid-number',
      });
      expect(mockCreateBeneficiary).toHaveBeenCalledWith(parsedData);
    });
  });
});