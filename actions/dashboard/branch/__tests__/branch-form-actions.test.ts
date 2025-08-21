import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

import { createBranch, updateBranch } from '../actions';
import { branchFormAction } from '../branch-form-actions';

// Mock the actions
jest.mock('../actions');
const mockCreateBranch = createBranch as jest.MockedFunction<typeof createBranch>;
const mockUpdateBranch = updateBranch as jest.MockedFunction<typeof updateBranch>;

describe('branchFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new branch', () => {
    beforeEach(() => {
      formData.append('organization_id', 'org-123');
      formData.append('address_id', 'addr-456');
      formData.append('name', 'Test Branch');
      formData.append('code', 'TB001');
      formData.append('phone', '+1234567890');
      formData.append('active', 'true');
    });

    it('should create branch successfully', async () => {
      const mockCreatedBranch = {
        id: '1',
        organization_id: 'org-123',
        address_id: 'addr-456',
        name: 'Test Branch',
        code: 'TB001',
        phone: '+1234567890',
        active: true,
      };

      mockCreateBranch.mockResolvedValue({
        data: mockCreatedBranch,
        error: null,
      });

      const result = await branchFormAction(prevState, formData);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: 'org-123',
        address_id: 'addr-456',
        name: 'Test Branch',
        code: 'TB001',
        phone: '+1234567890',
        active: true,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Branch created successfully!',
      });
    });

    it('should handle creation with none address_id converted to null', async () => {
      const formDataNoAddress = new FormData();
      formDataNoAddress.append('organization_id', 'org-123');
      formDataNoAddress.append('address_id', 'none'); // Special 'none' value
      formDataNoAddress.append('name', 'Test Branch');
      formDataNoAddress.append('active', 'true');

      mockCreateBranch.mockResolvedValue({
        data: { id: '1', name: 'Test Branch', address_id: null },
        error: null,
      });

      const result = await branchFormAction(prevState, formDataNoAddress);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: 'org-123',
        address_id: null, // 'none' is converted to null
        name: 'Test Branch',
        code: null,
        phone: null,
        active: true,
      });

      expect(result.message).toBe('Branch created successfully!');
    });

    it('should handle creation with null optional fields', async () => {
      const formDataMinimal = new FormData();
      formDataMinimal.append('organization_id', 'org-123');
      formDataMinimal.append('name', 'Test Branch');
      formDataMinimal.append('active', 'false');

      mockCreateBranch.mockResolvedValue({
        data: { id: '1', name: 'Test Branch' },
        error: null,
      });

      const result = await branchFormAction(prevState, formDataMinimal);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: 'org-123',
        address_id: null,
        name: 'Test Branch',
        code: null,
        phone: null,
        active: false,
      });
    });

    it('should handle empty string optional fields converted to null', async () => {
      const formDataEmptyStrings = new FormData();
      formDataEmptyStrings.append('organization_id', 'org-123');
      formDataEmptyStrings.append('name', 'Test Branch');
      formDataEmptyStrings.append('code', '');
      formDataEmptyStrings.append('phone', '');
      formDataEmptyStrings.append('active', 'true');

      mockCreateBranch.mockResolvedValue({
        data: { id: '1', name: 'Test Branch' },
        error: null,
      });

      const result = await branchFormAction(prevState, formDataEmptyStrings);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: 'org-123',
        address_id: null,
        name: 'Test Branch',
        code: null, // Empty string converted to null
        phone: null, // Empty string converted to null
        active: true,
      });
    });

    it('should handle active field variations', async () => {
      const testCases = [
        { value: 'true', expected: true },
        { value: 'false', expected: false },
        { value: '1', expected: false }, // Only 'true' string is truthy
        { value: 'on', expected: false },
        { value: '', expected: false },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('organization_id', 'org-123');
        testFormData.append('name', 'Test Branch');
        testFormData.append('active', testCase.value);

        mockCreateBranch.mockClear();
        mockCreateBranch.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await branchFormAction(prevState, testFormData);

        expect(mockCreateBranch).toHaveBeenCalledWith({
          organization_id: 'org-123',
          address_id: null,
          name: 'Test Branch',
          code: null,
          phone: null,
          active: testCase.expected,
        });
      }
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateBranch.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            organization_id: 'Organization is required',
            name: 'Name is required',
            code: 'Code must be unique',
          },
        },
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          organization_id: ['Organization is required'],
          name: ['Name is required'],
          code: ['Code must be unique'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateBranch.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the branch.',
      });
    });
  });

  describe('updating existing branch', () => {
    const branchId = 'branch-1';

    beforeEach(() => {
      formData.append('id', branchId);
      formData.append('organization_id', 'org-456');
      formData.append('address_id', 'addr-789');
      formData.append('name', 'Updated Branch');
      formData.append('code', 'UB002');
      formData.append('phone', '+9876543210');
      formData.append('active', 'false');
    });

    it('should update branch successfully', async () => {
      const mockUpdatedBranch = {
        id: branchId,
        organization_id: 'org-456',
        address_id: 'addr-789',
        name: 'Updated Branch',
        code: 'UB002',
        phone: '+9876543210',
        active: false,
      };

      mockUpdateBranch.mockResolvedValue({
        data: mockUpdatedBranch,
        error: null,
      });

      const result = await branchFormAction(prevState, formData);

      expect(mockUpdateBranch).toHaveBeenCalledWith(branchId, {
        organization_id: 'org-456',
        address_id: 'addr-789',
        name: 'Updated Branch',
        code: 'UB002',
        phone: '+9876543210',
        active: false,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Branch updated successfully!',
      });
    });

    it('should handle update with none address_id', async () => {
      const formDataNoAddress = new FormData();
      formDataNoAddress.append('id', branchId);
      formDataNoAddress.append('organization_id', 'org-456');
      formDataNoAddress.append('address_id', 'none');
      formDataNoAddress.append('name', 'Updated Branch');
      formDataNoAddress.append('active', 'true');

      mockUpdateBranch.mockResolvedValue({
        data: { id: branchId, name: 'Updated Branch' },
        error: null,
      });

      const result = await branchFormAction(prevState, formDataNoAddress);

      expect(mockUpdateBranch).toHaveBeenCalledWith(branchId, {
        organization_id: 'org-456',
        address_id: null, // 'none' converted to null
        name: 'Updated Branch',
        code: null,
        phone: null,
        active: true,
      });

      expect(result.message).toBe('Branch updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateBranch.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name cannot be empty',
            phone: 'Invalid phone format',
          },
        },
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
          phone: ['Invalid phone format'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateBranch.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the branch.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateBranch.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await branchFormAction(prevState, emptyFormData);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: null, // Missing fields become null
        address_id: null,
        name: null,
        code: null,
        phone: null,
        active: false,
      });
    });

    it('should handle address_id special cases', async () => {
      const testCases = [
        { value: 'none', expected: null },
        { value: 'addr-123', expected: 'addr-123' },
        { value: '', expected: null }, // Empty string becomes null after 'none' check
        { value: '0', expected: '0' }, // Valid ID
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('organization_id', 'org-123');
        testFormData.append('name', 'Test Branch');
        testFormData.append('address_id', testCase.value);

        mockCreateBranch.mockClear();
        mockCreateBranch.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await branchFormAction(prevState, testFormData);

        expect(mockCreateBranch).toHaveBeenCalledWith({
          organization_id: 'org-123',
          address_id: testCase.expected,
          name: 'Test Branch',
          code: null,
          phone: null,
          active: false,
        });
      }
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('name', '  Test Branch  ');
      formData.append('code', '  TB001  ');
      formData.append('phone', '  +1234567890  ');

      mockCreateBranch.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await branchFormAction(prevState, formData);

      expect(mockCreateBranch).toHaveBeenCalledWith({
        organization_id: null,
        address_id: null,
        name: '  Test Branch  ', // Whitespace is preserved
        code: '  TB001  ',
        phone: '  +1234567890  ',
        active: false,
      });
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('organization_id', 'org-123');
      formData.append('name', 'Test Branch');
    });

    it('should handle undefined error object', async () => {
      mockCreateBranch.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the branch.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateBranch.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await branchFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the branch.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateBranch.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Single string error',
            code: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await branchFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        name: ['Single string error'],
        code: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateBranch.mockRejectedValue(new Error('Network error'));

      formData.append('organization_id', 'org-123');
      formData.append('name', 'Test Branch');

      await expect(branchFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', name: 'Test Branch' },
            error: null,
          });
        }, 100);
      });

      mockCreateBranch.mockReturnValue(slowResponse as any);

      formData.append('organization_id', 'org-123');
      formData.append('name', 'Test Branch');

      const result = await branchFormAction(prevState, formData);

      expect(result.message).toBe('Branch created successfully!');
    });
  });
});