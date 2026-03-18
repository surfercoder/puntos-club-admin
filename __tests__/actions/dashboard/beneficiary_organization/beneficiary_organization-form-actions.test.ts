jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

jest.mock('@/actions/dashboard/beneficiary_organization/actions', () => ({
  createBeneficiaryOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateBeneficiaryOrganization: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

import { revalidatePath } from 'next/cache';
import { beneficiaryOrganizationFormAction } from '@/actions/dashboard/beneficiary_organization/beneficiary_organization-form-actions';
import { createBeneficiaryOrganization, updateBeneficiaryOrganization } from '@/actions/dashboard/beneficiary_organization/actions';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('beneficiaryOrganizationFormAction', () => {
  it('should create successfully', async () => {
    const fd = createFormData({ beneficiary_id: '10', organization_id: '20' });
    const result = await beneficiaryOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(createBeneficiaryOrganization).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/beneficiary_organization');
    expect(result.status).toBe('success');
  });

  it('should update successfully', async () => {
    const fd = createFormData({ id: '1', beneficiary_id: '10', organization_id: '20' });
    const result = await beneficiaryOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateBeneficiaryOrganization).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should return validation error', async () => {
    const fd = createFormData({ beneficiary_id: '', organization_id: '' });
    const result = await beneficiaryOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should handle thrown error', async () => {
    (createBeneficiaryOrganization as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ beneficiary_id: '10', organization_id: '20' });
    const result = await beneficiaryOrganizationFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
