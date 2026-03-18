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

import {
  createOrganizationNotificationLimit,
  updateOrganizationNotificationLimit,
  deleteOrganizationNotificationLimit,
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
  monthly_limit: 20,
  min_hours_between_notifications: 12,
  notifications_sent_today: 0,
  notifications_sent_this_month: 0,
};

describe('createOrganizationNotificationLimit', () => {
  it('should create successfully', async () => {
    const result = await createOrganizationNotificationLimit(validInput);
    expect(mockSupabase.from).toHaveBeenCalledWith('organization_notification_limits');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createOrganizationNotificationLimit({ ...validInput, organization_id: '' });
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
    const result = await updateOrganizationNotificationLimit('1', { ...validInput, organization_id: '' });
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
    const result = await createOrganizationNotificationLimit({ ...validInput, organization_id: '' });
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
    const result = await updateOrganizationNotificationLimit('1', { ...validInput, organization_id: '' });
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
