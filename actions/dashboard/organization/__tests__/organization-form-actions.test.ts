import { organizationFormAction } from '../organization-form-actions';
import { createOrganization, updateOrganization } from '../actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

// Mock the actions
jest.mock('../actions');
const mockCreateOrganization = createOrganization as jest.MockedFunction<typeof createOrganization>;
const mockUpdateOrganization = updateOrganization as jest.MockedFunction<typeof updateOrganization>;

describe('organizationFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new organization', () => {
    beforeEach(() => {
      formData.append('name', 'Test Organization');
      formData.append('business_name', 'Test Business Name');
      formData.append('tax_id', '12345678');
    });

    it('should create organization successfully', async () => {
      const mockCreatedOrganization = {
        id: '1',
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
      };

      mockCreateOrganization.mockResolvedValue({
        data: mockCreatedOrganization,
        error: null,
      });

      const result = await organizationFormAction(prevState, formData);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Organization created successfully!',
      });
    });

    it('should handle creation with null business_name', async () => {
      const formDataWithoutBusinessName = new FormData();
      formDataWithoutBusinessName.append('name', 'Test Organization');
      formDataWithoutBusinessName.append('tax_id', '12345678');

      mockCreateOrganization.mockResolvedValue({
        data: { id: '1', name: 'Test Organization', tax_id: '12345678' },
        error: null,
      });

      const result = await organizationFormAction(prevState, formDataWithoutBusinessName);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: null,
        tax_id: '12345678',
      });

      expect(result.message).toBe('Organization created successfully!');
    });

    it('should handle creation with null tax_id', async () => {
      const formDataWithoutTaxId = new FormData();
      formDataWithoutTaxId.append('name', 'Test Organization');
      formDataWithoutTaxId.append('business_name', 'Test Business Name');

      mockCreateOrganization.mockResolvedValue({
        data: { id: '1', name: 'Test Organization', business_name: 'Test Business Name' },
        error: null,
      });

      const result = await organizationFormAction(prevState, formDataWithoutTaxId);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: null,
      });

      expect(result.message).toBe('Organization created successfully!');
    });

    it('should handle creation with empty string fields converted to null', async () => {
      const formDataWithEmptyStrings = new FormData();
      formDataWithEmptyStrings.append('name', 'Test Organization');
      formDataWithEmptyStrings.append('business_name', '');
      formDataWithEmptyStrings.append('tax_id', '');

      mockCreateOrganization.mockResolvedValue({
        data: { id: '1', name: 'Test Organization' },
        error: null,
      });

      const result = await organizationFormAction(prevState, formDataWithEmptyStrings);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: null,
        tax_id: null,
      });
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateOrganization.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name is required',
            tax_id: 'Invalid tax ID format',
          },
        },
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name is required'],
          tax_id: ['Invalid tax ID format'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateOrganization.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the organization.',
      });
    });
  });

  describe('updating existing organization', () => {
    const organizationId = 'org-1';

    beforeEach(() => {
      formData.append('id', organizationId);
      formData.append('name', 'Updated Organization');
      formData.append('business_name', 'Updated Business Name');
      formData.append('tax_id', '87654321');
    });

    it('should update organization successfully', async () => {
      const mockUpdatedOrganization = {
        id: organizationId,
        name: 'Updated Organization',
        business_name: 'Updated Business Name',
        tax_id: '87654321',
      };

      mockUpdateOrganization.mockResolvedValue({
        data: mockUpdatedOrganization,
        error: null,
      });

      const result = await organizationFormAction(prevState, formData);

      expect(mockUpdateOrganization).toHaveBeenCalledWith(organizationId, {
        name: 'Updated Organization',
        business_name: 'Updated Business Name',
        tax_id: '87654321',
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Organization updated successfully!',
      });
    });

    it('should handle update with null optional fields', async () => {
      const formDataPartial = new FormData();
      formDataPartial.append('id', organizationId);
      formDataPartial.append('name', 'Updated Organization');
      // No business_name or tax_id

      mockUpdateOrganization.mockResolvedValue({
        data: { id: organizationId, name: 'Updated Organization' },
        error: null,
      });

      const result = await organizationFormAction(prevState, formDataPartial);

      expect(mockUpdateOrganization).toHaveBeenCalledWith(organizationId, {
        name: 'Updated Organization',
        business_name: null,
        tax_id: null,
      });

      expect(result.message).toBe('Organization updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateOrganization.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name cannot be empty',
            business_name: 'Business name too long',
          },
        },
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
          business_name: ['Business name too long'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateOrganization.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the organization.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateOrganization.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await organizationFormAction(prevState, emptyFormData);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: null, // Missing fields become null
        business_name: null,
        tax_id: null,
      });
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('name', '  Test Organization  ');
      formData.append('business_name', '  Test Business  ');
      formData.append('tax_id', '  12345678  ');

      mockCreateOrganization.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await organizationFormAction(prevState, formData);

      expect(mockCreateOrganization).toHaveBeenCalledWith({
        name: '  Test Organization  ', // Whitespace is preserved
        business_name: '  Test Business  ',
        tax_id: '  12345678  ',
      });
    });

    it('should handle empty string conversion to null', async () => {
      const testCases = [
        { value: '', expected: null },
        { value: '   ', expected: '   ' }, // Only empty string becomes null, not whitespace
        { value: 'valid', expected: 'valid' },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('name', 'Test Organization');
        testFormData.append('business_name', testCase.value);

        mockCreateOrganization.mockClear();
        mockCreateOrganization.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await organizationFormAction(prevState, testFormData);

        expect(mockCreateOrganization).toHaveBeenCalledWith({
          name: 'Test Organization',
          business_name: testCase.expected,
          tax_id: null,
        });
      }
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('name', 'Test Organization');
    });

    it('should handle undefined error object', async () => {
      mockCreateOrganization.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the organization.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateOrganization.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the organization.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateOrganization.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Single string error',
            business_name: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await organizationFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        name: ['Single string error'],
        business_name: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateOrganization.mockRejectedValue(new Error('Network error'));

      formData.append('name', 'Test Organization');

      await expect(organizationFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', name: 'Test Organization' },
            error: null,
          });
        }, 100);
      });

      mockCreateOrganization.mockReturnValue(slowResponse as any);

      formData.append('name', 'Test Organization');

      const result = await organizationFormAction(prevState, formData);

      expect(result.message).toBe('Organization created successfully!');
    });
  });
});