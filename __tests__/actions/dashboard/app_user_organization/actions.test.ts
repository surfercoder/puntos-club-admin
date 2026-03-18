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
  createAppUserOrganization,
  updateAppUserOrganization,
  deleteAppUserOrganization,
  getAppUserOrganizations,
  getAppUserOrganization,
} from '@/actions/dashboard/app_user_organization/actions';

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
  app_user_id: '10',
  organization_id: '20',
  is_active: true,
};

describe('createAppUserOrganization', () => {
  it('should create successfully', async () => {
    const result = await createAppUserOrganization(validInput);
    expect(mockSupabase.from).toHaveBeenCalledWith('app_user_organization');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createAppUserOrganization({ ...validInput, app_user_id: '', organization_id: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await createAppUserOrganization(validInput);
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('updateAppUserOrganization', () => {
  it('should update successfully', async () => {
    const result = await updateAppUserOrganization('1', validInput);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateAppUserOrganization('1', { ...validInput, app_user_id: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createAppUserOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user_organization.schema').AppUserOrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createAppUserOrganization({ ...validInput, app_user_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateAppUserOrganization - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user_organization.schema').AppUserOrganizationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateAppUserOrganization('1', { ...validInput, app_user_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deleteAppUserOrganization', () => {
  it('should delete successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteAppUserOrganization('1');
    expect(result.error).toBeNull();
  });
});

describe('getAppUserOrganizations', () => {
  it('should return list', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getAppUserOrganizations();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getAppUserOrganization', () => {
  it('should return item by id', async () => {
    const result = await getAppUserOrganization('1');
    expect(result.data).toBeDefined();
  });
});
