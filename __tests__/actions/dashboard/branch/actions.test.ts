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
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  neq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { id: '1', name: 'Test Branch' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import { createBranch, updateBranch, deleteBranch } from '@/actions/dashboard/branch/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === 'active_org_id') return { value: '123' };
    return undefined;
  });
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'Test Branch' }, error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

const validBranch = { name: 'Branch 1', address_id: '10', phone: null, active: true };

describe('createBranch', () => {
  it('should create a branch successfully', async () => {
    const result = await createBranch(validBranch);
    expect(mockSupabase.from).toHaveBeenCalledWith('branch');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Branch 1', organization_id: 123 }),
    ]);
    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createBranch({ name: '', address_id: '', active: true, phone: null });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await createBranch(validBranch);
    expect(result).toEqual({ data: null, error: { message: 'No active organization selected' } });
  });

  it('should return error when plan limit is reached', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Plan limit reached' });
    const result = await createBranch(validBranch);
    expect(result).toEqual({ data: null, error: { message: 'Plan limit reached' } });
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'DB error' } });
    const result = await createBranch(validBranch);
    expect(result.error).toEqual({ message: 'DB error' });
  });
});

describe('createBranch - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/branch.schema').BranchSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createBranch({ name: '', address_id: '', active: true, phone: null });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateBranch - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/branch.schema').BranchSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateBranch('1', { name: '', address_id: '', active: true, phone: null });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateBranch', () => {
  it('should update a branch successfully', async () => {
    const result = await updateBranch('1', validBranch);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateBranch('1', { name: '', address_id: '', active: true, phone: null });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await updateBranch('1', validBranch);
    expect(result).toEqual({ data: null, error: { message: 'No active organization selected' } });
  });
});

describe('deleteBranch', () => {
  it('should delete a branch successfully', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: null });
    const result = await deleteBranch('1');
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  it('should return error when no active org', async () => {
    mockCookieStore.get.mockReturnValue(undefined);
    const result = await deleteBranch('1');
    expect(result).toEqual({ error: { message: 'No active organization selected' } });
  });

  it('should return formatted error on failure', async () => {
    mockSupabase.eq
      .mockReturnValueOnce(mockSupabase)
      .mockReturnValueOnce({ error: { message: 'FK constraint', code: '23503' } });
    const result = await deleteBranch('1');
    expect(result.error).toEqual({ message: 'FK constraint', code: '23503' });
  });
});
