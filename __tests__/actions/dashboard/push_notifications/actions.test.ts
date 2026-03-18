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
  createPushNotification,
  updatePushNotification,
  deletePushNotification,
} from '@/actions/dashboard/push_notifications/actions';

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

const validNotification = {
  organization_id: '10',
  created_by: '1',
  title: 'Test',
  body: 'Test body',
  sent_count: 0,
  failed_count: 0,
  status: 'draft' as const,
};

describe('createPushNotification', () => {
  it('should create successfully', async () => {
    const result = await createPushNotification(validNotification);
    expect(mockSupabase.from).toHaveBeenCalledWith('push_notifications');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createPushNotification({ ...validNotification, title: '', body: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await createPushNotification(validNotification);
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('updatePushNotification', () => {
  it('should update successfully', async () => {
    const result = await updatePushNotification('1', validNotification);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updatePushNotification('1', { ...validNotification, title: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createPushNotification - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/push_notification.schema').PushNotificationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createPushNotification({ ...validNotification, title: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updatePushNotification - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/push_notification.schema').PushNotificationSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updatePushNotification('1', { ...validNotification, title: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deletePushNotification', () => {
  it('should delete successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deletePushNotification('1');
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deletePushNotification('1');
    expect(result.error).toBeDefined();
  });
});
