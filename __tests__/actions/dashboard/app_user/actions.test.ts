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
  single: jest.fn(() => ({ data: { id: '1', name: 'cashier' }, error: null })),
  rpc: jest.fn(() => ({ data: null, error: null })),
  auth: { getUser: jest.fn(() => ({ data: { user: { id: 'auth-1' } }, error: null })) },
};
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/plans/usage', () => ({
  enforcePlanLimit: jest.fn(() => null),
}));

import {
  createAppUser,
  updateAppUser,
  deleteAppUser,
  getAppUsers,
  getAppUser,
} from '@/actions/dashboard/app_user/actions';
import { enforcePlanLimit } from '@/lib/plans/usage';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.order.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1', name: 'cashier' }, error: null });
  (enforcePlanLimit as jest.Mock).mockReturnValue(null);
});

const validAppUser = {
  organization_id: '10',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  active: true,
};

describe('createAppUser', () => {
  it('should create app user successfully', async () => {
    const result = await createAppUser(validAppUser);
    expect(mockSupabase.from).toHaveBeenCalledWith('app_user');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createAppUser({ ...validAppUser, organization_id: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should enforce plan limit for cashier role', async () => {
    (enforcePlanLimit as jest.Mock).mockReturnValue({ message: 'Limit reached' });
    // role_id triggers the role lookup which returns 'cashier'
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(result).toEqual({ data: null, error: { message: 'Limit reached' } });
  });

  it('should not enforce plan limit when role lookup returns non-mapped role', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: 'admin' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should skip plan limit when no role_id or organization_id', async () => {
    const result = await createAppUser(validAppUser);
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });
});

describe('createAppUser - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }, { path: ['email'], message: 'Bad email' }] },
    }));
    const result = await createAppUser({ ...validAppUser, organization_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({ email: 'Bad email' });
    schema.safeParse = orig;
  });
});

describe('updateAppUser - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/app_user.schema').AppUserSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateAppUser('1', { ...validAppUser, organization_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('createAppUser - role lookup returns null name', () => {
  it('should skip plan limit when roleData.name is null', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: null }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).not.toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });
});

describe('createAppUser - enforcePlanLimit returns null (no limit error)', () => {
  it('should proceed with insert when enforcePlanLimit returns null for collaborator', async () => {
    mockSupabase.single.mockReturnValueOnce({ data: { id: '1', name: 'collaborator' }, error: null })
      .mockReturnValue({ data: { id: '1' }, error: null });
    (enforcePlanLimit as jest.Mock).mockReturnValue(null);
    const result = await createAppUser({ ...validAppUser, role_id: '5' });
    expect(enforcePlanLimit).toHaveBeenCalledWith(10, 'collaborators');
    expect(result.data).toBeDefined();
  });
});

describe('updateAppUser', () => {
  it('should update app user successfully', async () => {
    const result = await updateAppUser('1', validAppUser);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateAppUser('1', { ...validAppUser, organization_id: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('deleteAppUser', () => {
  it('should delete app user successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteAppUser('1');
    expect(result.error).toBeNull();
  });
});

describe('getAppUsers', () => {
  it('should return app users', async () => {
    mockSupabase.order.mockReturnValue({ data: [{ id: '1' }], error: null });
    const result = await getAppUsers();
    expect(result.data).toEqual([{ id: '1' }]);
  });
});

describe('getAppUser', () => {
  it('should return single app user', async () => {
    const result = await getAppUser('1');
    expect(result.data).toBeDefined();
  });
});
