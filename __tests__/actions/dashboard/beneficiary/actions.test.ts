jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(() => ({ value: '123' })),
    set: jest.fn(),
  })),
}));

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', first_name: 'John' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));

import {
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
} from '@/actions/dashboard/beneficiary/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', first_name: 'John' }, error: null });
});

const validBeneficiary = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  available_points: 0,
};

describe('createBeneficiary', () => {
  it('should create beneficiary successfully', async () => {
    const result = await createBeneficiary(validBeneficiary);
    expect(mockSupabase.from).toHaveBeenCalledWith('beneficiary');
    expect(mockSupabase.insert).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid email', async () => {
    const result = await createBeneficiary({ ...validBeneficiary, email: 'notanemail' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createBeneficiary(validBeneficiary);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('updateBeneficiary', () => {
  it('should update beneficiary successfully', async () => {
    const result = await updateBeneficiary('1', validBeneficiary);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid email', async () => {
    const result = await updateBeneficiary('1', { ...validBeneficiary, email: 'bad' });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createBeneficiary - validation with empty path', () => {
  it('should skip errors with empty path[0]', async () => {
    // Manually mock safeParse to return an error with an empty path
    const BeneficiarySchema = require('@/schemas/beneficiary.schema').BeneficiarySchema;
    const original = BeneficiarySchema.safeParse;
    BeneficiarySchema.safeParse = jest.fn(() => ({
      success: false,
      error: {
        issues: [
          { path: [], message: 'Root error' },
          { path: ['email'], message: 'Invalid email' },
        ],
      },
    }));
    const result = await createBeneficiary({ ...validBeneficiary, email: 'bad' });
    expect(result.error).toHaveProperty('fieldErrors');
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({ email: 'Invalid email' });
    BeneficiarySchema.safeParse = original;
  });
});

describe('updateBeneficiary - validation with empty path', () => {
  it('should skip errors with empty path[0]', async () => {
    const BeneficiarySchema = require('@/schemas/beneficiary.schema').BeneficiarySchema;
    const original = BeneficiarySchema.safeParse;
    BeneficiarySchema.safeParse = jest.fn(() => ({
      success: false,
      error: {
        issues: [
          { path: [], message: 'Root error' },
        ],
      },
    }));
    const result = await updateBeneficiary('1', { ...validBeneficiary, email: 'bad' });
    expect(result.error).toHaveProperty('fieldErrors');
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    BeneficiarySchema.safeParse = original;
  });
});

describe('deleteBeneficiary', () => {
  it('should delete beneficiary successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteBeneficiary('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deleteBeneficiary('1');
    expect(result.error).toBeDefined();
  });
});
