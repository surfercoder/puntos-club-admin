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
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn(() => mockSupabase) }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn(() => mockSupabase) }));
const mockGetCurrentUser = jest.fn((): unknown => ({ id: 7, role: { name: 'admin' } }));
jest.mock('@/lib/auth/get-current-user', () => ({ getCurrentUser: () => mockGetCurrentUser() }));
const mockIsAdmin = jest.fn(() => true);
jest.mock('@/lib/auth/roles', () => ({ isAdmin: () => mockIsAdmin() }));

import { revalidatePath } from 'next/cache';
import {
  createOrganizationNotificationLimit,
  updateOrganizationNotificationLimit,
  deleteOrganizationNotificationLimit,
  grantNotificationCredits,
} from '@/actions/dashboard/organization_notification_limits/actions';

beforeEach(() => {
  jest.clearAllMocks();
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.update.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);
  mockSupabase.single.mockReturnValue({ data: { id: '1' }, error: null });
});

const validInput = {
  organization_id: '10',
  plan_type: 'free' as const,
  daily_limit: 5,
  notifications_granted: 20,
  min_hours_between_notifications: 12,
  notifications_sent_today: 0,
  notifications_used: 0,
} as never;

describe('createOrganizationNotificationLimit', () => {
  it('should create successfully', async () => {
    const result = await createOrganizationNotificationLimit(validInput);
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_notification_limits');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createOrganizationNotificationLimit({ ...(validInput as object), organization_id: '' } as never);
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error on failure', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await createOrganizationNotificationLimit(validInput);
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('updateOrganizationNotificationLimit', () => {
  it('should update successfully', async () => {
    const result = await updateOrganizationNotificationLimit('1', validInput);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updateOrganizationNotificationLimit('1', { ...(validInput as object), organization_id: '' } as never);
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createOrganizationNotificationLimit - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization_notification_limit.schema').OrganizationNotificationLimitSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createOrganizationNotificationLimit({ ...(validInput as object), organization_id: '' } as never);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updateOrganizationNotificationLimit - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/organization_notification_limit.schema').OrganizationNotificationLimitSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updateOrganizationNotificationLimit('1', { ...(validInput as object), organization_id: '' } as never);
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deleteOrganizationNotificationLimit', () => {
  it('should delete successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deleteOrganizationNotificationLimit('1');
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deleteOrganizationNotificationLimit('1');
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('grantNotificationCredits', () => {
  beforeEach(() => {
    mockIsAdmin.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({ id: 7, role: { name: 'admin' } });
  });

  it('rejects a non-admin without touching the db', async () => {
    mockIsAdmin.mockReturnValue(false);
    expect(await grantNotificationCredits('3', 10, '')).toEqual({ error: 'db.forbidden' });
    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });

  it.each([0, 1.5, Number.NaN])('rejects the amount %p', async (amount) => {
    expect(await grantNotificationCredits('3', amount, '')).toEqual({ error: 'db.forbidden' });
    expect(mockSupabase.insert).not.toHaveBeenCalled();
  });

  it('inserts an admin credit with the trimmed note and revalidates', async () => {
    mockSupabase.insert.mockReturnValue({ error: null } as never);
    expect(await grantNotificationCredits('3', -5, '  regalo  ')).toEqual({ error: null });
    expect(mockSupabase.from).toHaveBeenCalledWith('notification_credit');
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      organization_id: 3,
      amount: -5,
      source: 'admin',
      note: 'regalo',
      created_by: 7,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/organization_notification_limits');
  });

  it('stores a blank note as null and a missing user id as null', async () => {
    mockGetCurrentUser.mockReturnValue(null);
    mockSupabase.insert.mockReturnValue({ error: null } as never);
    await grantNotificationCredits('3', 10, '   ');
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({ note: null, created_by: null }),
    );
  });

  it('returns the translated error when the insert fails', async () => {
    mockSupabase.insert.mockReturnValue({ error: { message: 'denied', code: '42501' } } as never);
    const result = await grantNotificationCredits('3', 10, '');
    expect(typeof result.error).toBe('string');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
