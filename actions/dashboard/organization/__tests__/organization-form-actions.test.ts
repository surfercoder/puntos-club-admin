import { revalidatePath } from 'next/cache';

import { fromErrorToActionState, toActionState } from '@/lib/error-handler';
import { OrganizationSchema } from '@/schemas/organization.schema';

import { createOrganization, updateOrganization } from '../actions';
import { organizationFormAction } from '../organization-form-actions';

// Mock the dependencies
jest.mock('../actions');
jest.mock('@/lib/error-handler');
jest.mock('@/schemas/organization.schema', () => ({
  OrganizationSchema: {
    safeParse: jest.fn(),
  },
}));
jest.mock('next/cache');

const mockCreateOrganization = createOrganization as jest.MockedFunction<typeof createOrganization>;
const mockUpdateOrganization = updateOrganization as jest.MockedFunction<typeof updateOrganization>;
const mockFromErrorToActionState = fromErrorToActionState as jest.MockedFunction<typeof fromErrorToActionState>;
const mockToActionState = toActionState as jest.MockedFunction<typeof toActionState>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

const mockOrganizationSchema = OrganizationSchema as jest.Mocked<typeof OrganizationSchema>;

describe('organizationFormAction', () => {
  let formData: FormData;
  const prevState = {} as any; // Not used in this implementation

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  describe('creating new organization', () => {
    beforeEach(() => {
      formData.append('name', 'Test Organization');
      formData.append('business_name', 'Test Business Name');
      formData.append('tax_id', '12345678');
    });

    it('should create organization successfully', async () => {
      const parsedData = {
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Organization created successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
      });

      expect(mockCreateOrganization).toHaveBeenCalledWith(parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/organization');
      expect(mockToActionState).toHaveBeenCalledWith('Organization created successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors from schema', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name is required'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockCreateOrganization).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle missing required fields', async () => {
      const emptyFormData = new FormData();
      
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name is required' },
        ],
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { 
        fieldErrors: { 
          name: ['Name is required'],
        } 
      };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await organizationFormAction(prevState, emptyFormData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during creation', async () => {
      const parsedData = {
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Database connection failed');
      mockCreateOrganization.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Database error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockCreateOrganization).toHaveBeenCalledWith(parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('updating existing organization', () => {
    const organizationId = '123';

    beforeEach(() => {
      formData.append('id', organizationId);
      formData.append('name', 'Updated Organization');
      formData.append('business_name', 'Updated Business Name');
      formData.append('tax_id', '87654321');
    });

    it('should update organization successfully', async () => {
      const parsedData = {
        id: organizationId,
        name: 'Updated Organization',
        business_name: 'Updated Business Name',
        tax_id: '87654321',
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const expectedSuccessState = { message: 'Organization updated successfully!' };
      mockToActionState.mockReturnValue(expectedSuccessState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({
        id: organizationId,
        name: 'Updated Organization',
        business_name: 'Updated Business Name',
        tax_id: '87654321',
      });

      expect(mockUpdateOrganization).toHaveBeenCalledWith(organizationId, parsedData);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/organization');
      expect(mockToActionState).toHaveBeenCalledWith('Organization updated successfully!');
      expect(result).toEqual(expectedSuccessState);
    });

    it('should handle validation errors during update', async () => {
      const validationError = {
        errors: [
          { path: ['name'], message: 'Name cannot be empty' },
        ],
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const expectedErrorState = { fieldErrors: { name: ['Name cannot be empty'] } };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockFromErrorToActionState).toHaveBeenCalledWith(validationError);
      expect(mockUpdateOrganization).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });

    it('should handle database errors during update', async () => {
      const parsedData = {
        id: organizationId,
        name: 'Updated Organization',
        business_name: 'Updated Business Name',
        tax_id: '87654321',
      };

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const dbError = new Error('Update failed');
      mockUpdateOrganization.mockRejectedValue(dbError);

      const expectedErrorState = { message: 'Update error occurred' };
      mockFromErrorToActionState.mockReturnValue(expectedErrorState);

      const result = await organizationFormAction(prevState, formData);

      expect(mockUpdateOrganization).toHaveBeenCalledWith(organizationId, parsedData);
      expect(mockFromErrorToActionState).toHaveBeenCalledWith(dbError);
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(result).toEqual(expectedErrorState);
    });
  });

  describe('form data handling', () => {
    it('should convert FormData to object correctly', async () => {
      formData.append('name', 'Test Organization');
      formData.append('business_name', 'Test Business Name');
      formData.append('tax_id', '12345678');
      formData.append('extra_field', 'ignored'); // Extra fields should be included

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await organizationFormAction(prevState, formData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({
        name: 'Test Organization',
        business_name: 'Test Business Name',
        tax_id: '12345678',
        extra_field: 'ignored', // FormData entries are all passed to schema
      });
    });

    it('should handle form data with whitespace', async () => {
      formData.append('name', '  Test Organization  ');
      formData.append('business_name', '  Test Business Name  ');

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockToActionState.mockReturnValue({ message: 'Success' });

      await organizationFormAction(prevState, formData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({
        name: '  Test Organization  ', // Whitespace preserved
        business_name: '  Test Business Name  ',
      });
    });

    it('should handle empty form data', async () => {
      const emptyFormData = new FormData();

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await organizationFormAction(prevState, emptyFormData);

      expect(mockOrganizationSchema.safeParse).toHaveBeenCalledWith({});
    });
  });

  describe('revalidation behavior', () => {
    beforeEach(() => {
      formData.append('name', 'Test Organization');
    });

    it('should revalidate path on successful creation', async () => {
      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateOrganization.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await organizationFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/organization');
    });

    it('should revalidate path on successful update', async () => {
      formData.append('id', '123');

      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: { id: '123' },
      });

      mockUpdateOrganization.mockResolvedValue(undefined);
      mockToActionState.mockReturnValue({ message: 'Success' });

      await organizationFormAction(prevState, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/organization');
    });

    it('should not revalidate path on validation error', async () => {
      mockOrganizationSchema.safeParse.mockReturnValue({
        success: false,
        error: { errors: [] },
      });

      mockFromErrorToActionState.mockReturnValue({ fieldErrors: {} });

      await organizationFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it('should not revalidate path on database error', async () => {
      mockOrganizationSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      mockCreateOrganization.mockRejectedValue(new Error('DB Error'));
      mockFromErrorToActionState.mockReturnValue({ message: 'Error' });

      await organizationFormAction(prevState, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });
});