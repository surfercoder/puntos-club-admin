import { beneficiaryFormAction } from '../beneficiary-form-actions';
import { createBeneficiary, updateBeneficiary } from '../actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

// Mock the actions
jest.mock('../actions');
const mockCreateBeneficiary = createBeneficiary as jest.MockedFunction<typeof createBeneficiary>;
const mockUpdateBeneficiary = updateBeneficiary as jest.MockedFunction<typeof updateBeneficiary>;

describe('beneficiaryFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockCreatedBeneficiary = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        document_id: '12345678',
        available_points: '100',
      };

      mockCreateBeneficiary.mockResolvedValue({
        data: mockCreatedBeneficiary,
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        document_id: '12345678',
        available_points: '100',
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary created successfully!',
      });
    });

    it('should handle creation with all null optional fields', async () => {
      const formDataMinimal = new FormData();
      // All fields are optional and can be null

      mockCreateBeneficiary.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formDataMinimal);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        document_id: null,
        available_points: '0', // Default fallback for available_points
      });

      expect(result.message).toBe('Beneficiary created successfully!');
    });

    it('should handle creation with empty string fields converted to null', async () => {
      const formDataEmptyStrings = new FormData();
      formDataEmptyStrings.append('first_name', '');
      formDataEmptyStrings.append('last_name', '');
      formDataEmptyStrings.append('email', '');
      formDataEmptyStrings.append('phone', '');
      formDataEmptyStrings.append('document_id', '');
      formDataEmptyStrings.append('available_points', '');

      mockCreateBeneficiary.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formDataEmptyStrings);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: null, // Empty string converted to null
        last_name: null,
        email: null,
        phone: null,
        document_id: null,
        available_points: '0', // Empty string defaults to '0'
      });
    });

    it('should handle available_points with various values', async () => {
      const testCases = [
        { input: '100', expected: '100' },
        { input: '0', expected: '0' },
        { input: '', expected: '0' }, // Empty string defaults to '0'
        { input: 'invalid', expected: 'invalid' }, // Invalid values are preserved
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('first_name', 'John');
        testFormData.append('available_points', testCase.input);

        mockCreateBeneficiary.mockClear();
        mockCreateBeneficiary.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await beneficiaryFormAction(prevState, testFormData);

        expect(mockCreateBeneficiary).toHaveBeenCalledWith({
          first_name: 'John',
          last_name: null,
          email: null,
          phone: null,
          document_id: null,
          available_points: testCase.expected,
        });
      }
    });

    it('should handle partial data with some fields', async () => {
      const formDataPartial = new FormData();
      formDataPartial.append('first_name', 'Jane');
      formDataPartial.append('email', 'jane@example.com');
      formDataPartial.append('available_points', '50');

      mockCreateBeneficiary.mockResolvedValue({
        data: { id: '1', first_name: 'Jane', email: 'jane@example.com' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formDataPartial);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: 'Jane',
        last_name: null,
        email: 'jane@example.com',
        phone: null,
        document_id: null,
        available_points: '50',
      });
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateBeneficiary.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            email: 'Invalid email format',
            phone: 'Invalid phone format',
            document_id: 'Document ID already exists',
          },
        },
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          email: ['Invalid email format'],
          phone: ['Invalid phone format'],
          document_id: ['Document ID already exists'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateBeneficiary.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the beneficiary.',
      });
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
      const mockUpdatedBeneficiary = {
        id: beneficiaryId,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
        document_id: '87654321',
        available_points: '200',
      };

      mockUpdateBeneficiary.mockResolvedValue({
        data: mockUpdatedBeneficiary,
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(mockUpdateBeneficiary).toHaveBeenCalledWith(beneficiaryId, {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+9876543210',
        document_id: '87654321',
        available_points: '200',
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Beneficiary updated successfully!',
      });
    });

    it('should handle update with null fields', async () => {
      const formDataPartial = new FormData();
      formDataPartial.append('id', beneficiaryId);
      formDataPartial.append('first_name', 'Jane');
      // Other fields not provided, should become null

      mockUpdateBeneficiary.mockResolvedValue({
        data: { id: beneficiaryId, first_name: 'Jane' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formDataPartial);

      expect(mockUpdateBeneficiary).toHaveBeenCalledWith(beneficiaryId, {
        first_name: 'Jane',
        last_name: null,
        email: null,
        phone: null,
        document_id: null,
        available_points: '0', // Defaults to '0'
      });

      expect(result.message).toBe('Beneficiary updated successfully!');
    });

    it('should handle update with empty strings converted to null', async () => {
      const formDataEmptyFields = new FormData();
      formDataEmptyFields.append('id', beneficiaryId);
      formDataEmptyFields.append('first_name', 'Jane');
      formDataEmptyFields.append('last_name', ''); // Empty string
      formDataEmptyFields.append('email', ''); // Empty string
      formDataEmptyFields.append('available_points', '150');

      mockUpdateBeneficiary.mockResolvedValue({
        data: { id: beneficiaryId, first_name: 'Jane' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, formDataEmptyFields);

      expect(mockUpdateBeneficiary).toHaveBeenCalledWith(beneficiaryId, {
        first_name: 'Jane',
        last_name: null, // Empty string converted to null
        email: null, // Empty string converted to null
        phone: null,
        document_id: null,
        available_points: '150',
      });
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateBeneficiary.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            first_name: 'First name is required',
            email: 'Email already exists',
          },
        },
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          first_name: ['First name is required'],
          email: ['Email already exists'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateBeneficiary.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the beneficiary.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateBeneficiary.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await beneficiaryFormAction(prevState, emptyFormData);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: null, // Missing fields become null
        last_name: null,
        email: null,
        phone: null,
        document_id: null,
        available_points: '0', // Defaults to '0' when missing
      });
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('first_name', '  John  ');
      formData.append('last_name', '  Doe  ');
      formData.append('email', '  john@example.com  ');
      formData.append('phone', '  +1234567890  ');

      mockCreateBeneficiary.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await beneficiaryFormAction(prevState, formData);

      expect(mockCreateBeneficiary).toHaveBeenCalledWith({
        first_name: '  John  ', // Whitespace is preserved
        last_name: '  Doe  ',
        email: '  john@example.com  ',
        phone: '  +1234567890  ',
        document_id: null,
        available_points: '0',
      });
    });

    it('should handle empty string vs null conversion correctly', async () => {
      const testCases = [
        { value: '', expected: null },
        { value: '   ', expected: '   ' }, // Only empty string becomes null, not whitespace
        { value: 'valid', expected: 'valid' },
        { value: '0', expected: '0' },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('first_name', testCase.value);
        testFormData.append('available_points', '100');

        mockCreateBeneficiary.mockClear();
        mockCreateBeneficiary.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await beneficiaryFormAction(prevState, testFormData);

        expect(mockCreateBeneficiary).toHaveBeenCalledWith({
          first_name: testCase.expected,
          last_name: null,
          email: null,
          phone: null,
          document_id: null,
          available_points: '100',
        });
      }
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('first_name', 'John');
    });

    it('should handle undefined error object', async () => {
      mockCreateBeneficiary.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the beneficiary.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateBeneficiary.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the beneficiary.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateBeneficiary.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            first_name: 'Single string error',
            email: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        first_name: ['Single string error'],
        email: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateBeneficiary.mockRejectedValue(new Error('Network error'));

      formData.append('first_name', 'John');

      await expect(beneficiaryFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', first_name: 'John' },
            error: null,
          });
        }, 100);
      });

      mockCreateBeneficiary.mockReturnValue(slowResponse as any);

      formData.append('first_name', 'John');

      const result = await beneficiaryFormAction(prevState, formData);

      expect(result.message).toBe('Beneficiary created successfully!');
    });
  });

  describe('special field handling', () => {
    it('should handle available_points string preservation', async () => {
      const testCases = [
        '0',
        '100',
        '1000.50',
        'invalid-number', // Invalid values preserved as strings
      ];

      for (const points of testCases) {
        const testFormData = new FormData();
        testFormData.append('first_name', 'John');
        testFormData.append('available_points', points);

        mockCreateBeneficiary.mockClear();
        mockCreateBeneficiary.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await beneficiaryFormAction(prevState, testFormData);

        expect(mockCreateBeneficiary).toHaveBeenCalledWith({
          first_name: 'John',
          last_name: null,
          email: null,
          phone: null,
          document_id: null,
          available_points: points, // String value preserved
        });
      }
    });

    it('should handle all optional fields consistently', async () => {
      // Test that all fields except available_points follow the same null conversion pattern
      const optionalFields = ['first_name', 'last_name', 'email', 'phone', 'document_id'];
      
      for (const field of optionalFields) {
        const testFormData = new FormData();
        testFormData.append(field, '');

        mockCreateBeneficiary.mockClear();
        mockCreateBeneficiary.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await beneficiaryFormAction(prevState, testFormData);

        const expectedInput = {
          first_name: null,
          last_name: null,
          email: null,
          phone: null,
          document_id: null,
          available_points: '0',
        };

        expect(mockCreateBeneficiary).toHaveBeenCalledWith(expectedInput);
      }
    });
  });
});