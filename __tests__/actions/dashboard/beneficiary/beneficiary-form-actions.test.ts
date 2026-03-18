jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));

const mockCookieStore = {
  get: jest.fn((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  }),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

jest.mock('@/actions/dashboard/beneficiary/actions', () => ({
  createBeneficiary: jest.fn(() => ({ data: { id: '1' }, error: null })),
  updateBeneficiary: jest.fn(() => ({ data: { id: '1' }, error: null })),
}));

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(() => ({ id: 1, organization_id: 10 })),
}));

jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import { revalidatePath } from 'next/cache';
import { beneficiaryFormAction } from '@/actions/dashboard/beneficiary/beneficiary-form-actions';
import { createBeneficiary, updateBeneficiary } from '@/actions/dashboard/beneficiary/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';
import { EMPTY_ACTION_STATE } from '@/lib/error-handler';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  });
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  (createBeneficiary as jest.Mock).mockReturnValue({ data: { id: '1' }, error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

function createFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

describe('beneficiaryFormAction', () => {
  it('should create beneficiary and link to org', async () => {
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(createBeneficiary).toHaveBeenCalled();
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/beneficiary');
    expect(result.status).toBe('success');
  });

  it('should update beneficiary', async () => {
    const fd = createFormData({ id: '1', first_name: 'Jane', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(updateBeneficiary).toHaveBeenCalledWith('1', expect.any(Object));
    expect(result.status).toBe('success');
  });

  it('should return plan limit error on create', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ status: 'error', message: 'Limit reached', fieldErrors: {} });
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.message).toBe('Limit reached');
  });

  it('should not link when createBeneficiary returns no data.id', async () => {
    (createBeneficiary as jest.Mock).mockReturnValue({ data: {}, error: null });
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should not link when no active org id and no currentUser org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(mockSupabase.insert).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should not enforce plan limit when no orgId on create', async () => {
    const { getCurrentUser } = require('@/lib/auth/get-current-user');
    (getCurrentUser as jest.Mock).mockReturnValue({ id: 1, organization_id: null });
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('should handle thrown error', async () => {
    (createBeneficiary as jest.Mock).mockImplementation(() => { throw new Error('Error'); });
    const fd = createFormData({ first_name: 'John', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });

  it('should return validation error for invalid email', async () => {
    const fd = createFormData({ email: 'not-email', available_points: '0' });
    const result = await beneficiaryFormAction(EMPTY_ACTION_STATE, fd);
    expect(result.status).toBe('error');
  });
});
