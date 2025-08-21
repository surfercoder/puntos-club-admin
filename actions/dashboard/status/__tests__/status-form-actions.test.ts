import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

import { createStatus, updateStatus } from '../actions';
import { statusFormAction } from '../status-form-actions';

// Mock the actions
jest.mock('../actions');
const mockCreateStatus = createStatus as jest.MockedFunction<typeof createStatus>;
const mockUpdateStatus = updateStatus as jest.MockedFunction<typeof updateStatus>;

describe('statusFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
    prevState = EMPTY_ACTION_STATE;
  });

  describe('creating new status', () => {
    beforeEach(() => {
      formData.append('name', 'Test Status');
      formData.append('description', 'Test description');
      formData.append('is_terminal', 'on');
      formData.append('order_num', '5');
    });

    it('should create status successfully', async () => {
      const mockCreatedStatus = {
        id: '1',
        name: 'Test Status',
        description: 'Test description',
        is_terminal: true,
        order_num: 5,
      };

      mockCreateStatus.mockResolvedValue({
        data: mockCreatedStatus,
        error: null,
      });

      const result = await statusFormAction(prevState, formData);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: 'Test description',
        is_terminal: true,
        order_num: 5,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Status created successfully!',
      });
    });

    it('should handle creation with null description', async () => {
      const formDataWithoutDesc = new FormData();
      formDataWithoutDesc.append('name', 'Test Status');
      formDataWithoutDesc.append('is_terminal', 'on');
      formDataWithoutDesc.append('order_num', '3');

      mockCreateStatus.mockResolvedValue({
        data: { id: '1', name: 'Test Status', is_terminal: true, order_num: 3 },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataWithoutDesc);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: null,
        is_terminal: true,
        order_num: 3,
      });

      expect(result.message).toBe('Status created successfully!');
    });

    it('should handle unchecked is_terminal checkbox', async () => {
      const formDataNotTerminal = new FormData();
      formDataNotTerminal.append('name', 'Test Status');
      formDataNotTerminal.append('description', 'Test description');
      formDataNotTerminal.append('order_num', '2');
      // No 'is_terminal' field means checkbox is unchecked

      mockCreateStatus.mockResolvedValue({
        data: { id: '1', name: 'Test Status', is_terminal: false, order_num: 2 },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataNotTerminal);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: 'Test description',
        is_terminal: false,
        order_num: 2,
      });
    });

    it('should handle invalid order_num defaulting to 0', async () => {
      const formDataInvalidOrder = new FormData();
      formDataInvalidOrder.append('name', 'Test Status');
      formDataInvalidOrder.append('order_num', 'invalid');

      mockCreateStatus.mockResolvedValue({
        data: { id: '1', name: 'Test Status', order_num: 0 },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataInvalidOrder);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: null,
        is_terminal: false,
        order_num: 0,
      });
    });

    it('should handle missing order_num defaulting to 0', async () => {
      const formDataNoOrder = new FormData();
      formDataNoOrder.append('name', 'Test Status');

      mockCreateStatus.mockResolvedValue({
        data: { id: '1', name: 'Test Status', order_num: 0 },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataNoOrder);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: null,
        is_terminal: false,
        order_num: 0,
      });
    });

    it('should handle empty string description converted to null', async () => {
      const formDataEmptyDesc = new FormData();
      formDataEmptyDesc.append('name', 'Test Status');
      formDataEmptyDesc.append('description', '');
      formDataEmptyDesc.append('order_num', '1');

      mockCreateStatus.mockResolvedValue({
        data: { id: '1', name: 'Test Status' },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataEmptyDesc);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: 'Test Status',
        description: null,
        is_terminal: false,
        order_num: 1,
      });
    });

    it('should handle field validation errors from create action', async () => {
      mockCreateStatus.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name is required',
            order_num: 'Order number must be positive',
          },
        },
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name is required'],
          order_num: ['Order number must be positive'],
        },
      });
    });

    it('should handle general errors from create action', async () => {
      mockCreateStatus.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the status.',
      });
    });
  });

  describe('updating existing status', () => {
    const statusId = 'status-1';

    beforeEach(() => {
      formData.append('id', statusId);
      formData.append('name', 'Updated Status');
      formData.append('description', 'Updated description');
      formData.append('is_terminal', 'on');
      formData.append('order_num', '10');
    });

    it('should update status successfully', async () => {
      const mockUpdatedStatus = {
        id: statusId,
        name: 'Updated Status',
        description: 'Updated description',
        is_terminal: true,
        order_num: 10,
      };

      mockUpdateStatus.mockResolvedValue({
        data: mockUpdatedStatus,
        error: null,
      });

      const result = await statusFormAction(prevState, formData);

      expect(mockUpdateStatus).toHaveBeenCalledWith(statusId, {
        name: 'Updated Status',
        description: 'Updated description',
        is_terminal: true,
        order_num: 10,
      });

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'Status updated successfully!',
      });
    });

    it('should handle update with false is_terminal', async () => {
      const formDataNotTerminal = new FormData();
      formDataNotTerminal.append('id', statusId);
      formDataNotTerminal.append('name', 'Updated Status');
      formDataNotTerminal.append('order_num', '5');
      // No is_terminal checkbox means false

      mockUpdateStatus.mockResolvedValue({
        data: { id: statusId, name: 'Updated Status', is_terminal: false },
        error: null,
      });

      const result = await statusFormAction(prevState, formDataNotTerminal);

      expect(mockUpdateStatus).toHaveBeenCalledWith(statusId, {
        name: 'Updated Status',
        description: null,
        is_terminal: false,
        order_num: 5,
      });

      expect(result.message).toBe('Status updated successfully!');
    });

    it('should handle field validation errors from update action', async () => {
      mockUpdateStatus.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Name cannot be empty',
            order_num: 'Order number is required',
          },
        },
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
          order_num: ['Order number is required'],
        },
      });
    });

    it('should handle general errors from update action', async () => {
      mockUpdateStatus.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the status.',
      });
    });
  });

  describe('form data handling', () => {
    it('should handle missing form fields gracefully', async () => {
      const emptyFormData = new FormData();

      mockCreateStatus.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      const result = await statusFormAction(prevState, emptyFormData);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: null, // Missing fields become null
        description: null,
        is_terminal: false,
        order_num: 0,
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
        testFormData.append('name', 'Test Status');
        testFormData.append('is_terminal', testCase.value);

        mockCreateStatus.mockClear();
        mockCreateStatus.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await statusFormAction(prevState, testFormData);

        expect(mockCreateStatus).toHaveBeenCalledWith({
          name: 'Test Status',
          description: null,
          is_terminal: testCase.expected,
          order_num: 0,
        });
      }
    });

    it('should handle order_num parsing variations', async () => {
      const testCases = [
        { value: '5', expected: 5 },
        { value: '0', expected: 0 },
        { value: '-1', expected: -1 },
        { value: 'abc', expected: 0 },
        { value: '3.14', expected: 3 }, // parseInt truncates
        { value: '', expected: 0 },
      ];

      for (const testCase of testCases) {
        const testFormData = new FormData();
        testFormData.append('name', 'Test Status');
        testFormData.append('order_num', testCase.value);

        mockCreateStatus.mockClear();
        mockCreateStatus.mockResolvedValue({
          data: { id: '1' },
          error: null,
        });

        await statusFormAction(prevState, testFormData);

        expect(mockCreateStatus).toHaveBeenCalledWith({
          name: 'Test Status',
          description: null,
          is_terminal: false,
          order_num: testCase.expected,
        });
      }
    });

    it('should handle form fields with whitespace', async () => {
      formData.append('name', '  Test Status  ');
      formData.append('description', '  Test description  ');

      mockCreateStatus.mockResolvedValue({
        data: { id: '1' },
        error: null,
      });

      await statusFormAction(prevState, formData);

      expect(mockCreateStatus).toHaveBeenCalledWith({
        name: '  Test Status  ', // Whitespace is preserved
        description: '  Test description  ',
        is_terminal: false,
        order_num: 0,
      });
    });
  });

  describe('error handling edge cases', () => {
    beforeEach(() => {
      formData.append('name', 'Test Status');
    });

    it('should handle undefined error object', async () => {
      mockCreateStatus.mockResolvedValue({
        data: null,
        error: undefined as any,
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the status.',
      });
    });

    it('should handle error without fieldErrors property', async () => {
      mockCreateStatus.mockResolvedValue({
        data: null,
        error: { someOtherProperty: 'value' } as any,
      });

      const result = await statusFormAction(prevState, formData);

      expect(result).toEqual({
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the status.',
      });
    });

    it('should handle fieldErrors with mixed string and array values', async () => {
      mockCreateStatus.mockResolvedValue({
        data: null,
        error: {
          fieldErrors: {
            name: 'Single string error',
            order_num: ['Array error 1', 'Array error 2'],
          },
        },
      });

      const result = await statusFormAction(prevState, formData);

      expect(result.fieldErrors).toEqual({
        name: ['Single string error'],
        order_num: ['Array error 1', 'Array error 2'], // Arrays are preserved as-is
      });
    });
  });

  describe('async behavior', () => {
    it('should handle async errors from actions', async () => {
      mockCreateStatus.mockRejectedValue(new Error('Network error'));

      formData.append('name', 'Test Status');

      await expect(statusFormAction(prevState, formData)).rejects.toThrow('Network error');
    });

    it('should handle slow responses', async () => {
      const slowResponse = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: { id: '1', name: 'Test Status' },
            error: null,
          });
        }, 100);
      });

      mockCreateStatus.mockReturnValue(slowResponse as any);

      formData.append('name', 'Test Status');

      const result = await statusFormAction(prevState, formData);

      expect(result.message).toBe('Status created successfully!');
    });
  });
});