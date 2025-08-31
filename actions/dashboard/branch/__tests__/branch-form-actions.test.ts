import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState, EMPTY_ACTION_STATE } from '@/lib/error-handler';
import { BranchSchema } from '@/schemas/branch.schema';

import { createBranch, updateBranch } from '../actions';
import { branchFormAction } from '../branch-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/branch.schema', () => ({
  BranchSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateBranch = createBranch as jest.MockedFunction<typeof createBranch>;
const mockUpdateBranch = updateBranch as jest.MockedFunction<typeof updateBranch>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockBranchSchema = BranchSchema as jest.Mocked<typeof BranchSchema>;

describe('branchFormAction', () => {
  let formData: FormData;
  let prevState = EMPTY_ACTION_STATE;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
      const parsedData = {
        organization_id: 'org-123',
        address_id: 'addr-456',
        name: 'Test Branch',
        code: 'TB001',
        phone: '+1234567890',
        active: true,
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Branch created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await branchFormAction(prevState, formData);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-123',
        address_id: 'addr-456',
        name: 'Test Branch',
        code: 'TB001',
        phone: '+1234567890',
        active: 'true',
      });
      expect(mockCreateBranch).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/branch');
      expect(mockToActionState).toHaveBeenCalledWith('Branch created successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle schema validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['organization_id'], message: 'Organization is required' },
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          organization_id: ['Organization is required'],
          name: ['Name is required'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await branchFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });

    it('should handle runtime errors', async () => {
      const parsedData = {
        organization_id: 'org-123',
        name: 'Test Branch',
        active: true,
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const runtimeError = new Error('Database connection failed');
      mockCreateBranch.mockRejectedValue(runtimeError);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'An error occurred while saving the branch.',
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await branchFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(runtimeError);
      expect(result).toEqual(errorActionState);
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
      const parsedData = {
        id: branchId,
        organization_id: 'org-456',
        address_id: 'addr-789',
        name: 'Updated Branch',
        code: 'UB002',
        phone: '+9876543210',
        active: false,
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Branch updated successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      const result = await branchFormAction(prevState, formData);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith({
        id: branchId,
        organization_id: 'org-456',
        address_id: 'addr-789',
        name: 'Updated Branch',
        code: 'UB002',
        phone: '+9876543210',
        active: 'false',
      });
      expect(mockUpdateBranch).toHaveBeenCalledWith(branchId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/branch');
      expect(mockToActionState).toHaveBeenCalledWith('Branch updated successfully!');
      expect(result).toEqual(successActionState);
    });

    it('should handle update validation errors', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name cannot be empty' },
          { path: ['phone'], message: 'Invalid phone format' },
        ],
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      } as any);

      const errorActionState = {
        ...EMPTY_ACTION_STATE,
        fieldErrors: {
          name: ['Name cannot be empty'],
          phone: ['Invalid phone format'],
        },
      };
      mockFromErrorToActionState.mockReturnValue(errorActionState);

      const result = await branchFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(result).toEqual(errorActionState);
    });
  });

  describe('form data processing', () => {
    it('should handle Object.fromEntries with empty form data', async () => {
      const emptyFormData = new FormData();

      const parsedData = {
        organization_id: '',
        name: '',
        active: false,
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Branch created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await branchFormAction(prevState, emptyFormData);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith({});
    });

    it('should handle form data conversion correctly', async () => {
      const testFormData = new FormData();
      testFormData.append('organization_id', 'org-test');
      testFormData.append('name', 'Test Branch');
      testFormData.append('active', 'on'); // checkbox value

      const parsedData = {
        organization_id: 'org-test',
        name: 'Test Branch',
        active: true, // Schema converts 'on' to boolean
      };

      mockBranchSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      } as any);

      const successActionState = {
        ...EMPTY_ACTION_STATE,
        message: 'Branch created successfully!',
      };
      mockToActionState.mockReturnValue(successActionState);

      await branchFormAction(prevState, testFormData);

      expect(mockBranchSchema.safeParse).toHaveBeenCalledWith({
        organization_id: 'org-test',
        name: 'Test Branch',
        active: 'on',
      });
      expect(mockCreateBranch).toHaveBeenCalledWith(parsedData);
    });
  });
});