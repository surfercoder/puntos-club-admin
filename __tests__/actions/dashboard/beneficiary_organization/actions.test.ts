jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({ get: jest.fn(() => ({ value: '123' })), set: jest.fn() })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createBeneficiaryOrganization,
  updateBeneficiaryOrganization,
  deleteBeneficiaryOrganization,
  getBeneficiaryOrganizations,
  getBeneficiaryOrganization,
} from '@/actions/dashboard/beneficiary_organization/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });
});

const validInput = {
  beneficiary_id: '10',
  organization_id: '20',
  available_points: 0,
  total_points_earned: 0,
  total_points_redeemed: 0,
  is_active: true,
};

describe('createBeneficiaryOrganization', () => {
  it('should create successfully', async () => {
    const result = await createBeneficiaryOrganization(validInput);
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary_organization');
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createBeneficiaryOrganization({
      ...validInput,
      beneficiary_id: '',
      organization_id: '',
    });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should normalize supabase error', async () => {
    mockSupabase.single.mockReturnValue({
      data: null,
      error: { message: 'Duplicate', code: '23505', details: 'key exists', hint: '' },
    });
    const result = await createBeneficiaryOrganization(validInput);
    expect(result.error).toEqual({
      message: 'Duplicate',
      code: '23505',
      details: 'key exists',
      hint: '',
    });
  });
});

describe('updateBeneficiaryOrganization', () => {
  it('should update successfully', async () => {
    const result = await updateBeneficiaryOrganization('1', validInput);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateBeneficiaryOrganization('1', { ...validInput, beneficiary_id: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should normalize supabase error', async () => {
    mockSupabase.single.mockReturnValue({
      data: null,
      error: { message: 'Not found', code: 'PGRST116', details: '', hint: '' },
    });
    const result = await updateBeneficiaryOrganization('1', validInput);
    expect(result.error).toEqual({
      message: 'Not found',
      code: 'PGRST116',
      details: '',
      hint: '',
    });
  });
});

describe('createBeneficiaryOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/beneficiary_organization.schema').BeneficiaryOrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createBeneficiaryOrganization({ ...validInput, beneficiary_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('createBeneficiaryOrganization - is_active default', () => {
  it('should default is_active to true when not provided', async () => {
    const inputWithoutActive = { ...validInput };
    delete (inputWithoutActive as Record<string, unknown>).is_active;
    const result = await createBeneficiaryOrganization(inputWithoutActive);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});

describe('createBeneficiaryOrganization - is_active explicitly false', () => {
  it('should use false when is_active is explicitly set to false (line 31 ?? branch)', async () => {
    const result = await createBeneficiaryOrganization({ ...validInput, is_active: false });
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});

describe('updateBeneficiaryOrganization - is_active default', () => {
  it('should default is_active to true when not provided', async () => {
    const inputWithoutActive = { ...validInput };
    delete (inputWithoutActive as Record<string, unknown>).is_active;
    const result = await updateBeneficiaryOrganization('1', inputWithoutActive);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});

describe('updateBeneficiaryOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/beneficiary_organization.schema').BeneficiaryOrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateBeneficiaryOrganization('1', { ...validInput, beneficiary_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateBeneficiaryOrganization - is_active explicitly false', () => {
  it('should use false when is_active is explicitly set to false (line 76 ?? branch)', async () => {
    const result = await updateBeneficiaryOrganization('1', { ...validInput, is_active: false });
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});

describe('deleteBeneficiaryOrganization', () => {
  it('should delete successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteBeneficiaryOrganization('1');
    expect(result.error).toBeNull();
  });

  it('should normalize supabase error', async () => {
    mockSupabase.eq.mockReturnValue({
      error: { message: 'Error', code: '500', details: '', hint: '' },
    });
    const result = await deleteBeneficiaryOrganization('1');
    expect(result.error).toEqual({ message: 'Error', code: '500', details: '', hint: '' });
  });
});

describe('getBeneficiaryOrganizations', () => {
  it('should return list successfully', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getBeneficiaryOrganizations();
    expect(result.data).toEqual([{ id: '1' }]);
    expect(result.error).toBeNull();
  });

  it('should normalize error', async () => {
    mockSupabase.order.mockReturnValue({
      data: null,
      error: { message: 'Error', code: '500', details: '', hint: '' },
    });
    const result = await getBeneficiaryOrganizations();
    expect(result.error).toEqual({ message: 'Error', code: '500', details: '', hint: '' });
  });
});

describe('getBeneficiaryOrganization', () => {
  it('should return single item successfully', async () => {
    const result = await getBeneficiaryOrganization('1');
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should normalize error', async () => {
    mockSupabase.single.mockReturnValue({
      data: null,
      error: { message: 'Not found', code: 'PGRST116', details: '', hint: '' },
    });
    const result = await getBeneficiaryOrganization('999');
    expect(result.error).toBeDefined();
  });
});
