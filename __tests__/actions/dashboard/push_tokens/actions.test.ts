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
  createPushToken,
  updatePushToken,
  deletePushToken,
} from '@/actions/dashboard/push_tokens/actions';

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

const validToken = {
  beneficiary_id: '10',
  expo_push_token: 'ExponentPushToken[xxx]',
  is_active: true,
};

describe('createPushToken', () => {
  it('should create successfully', async () => {
    const result = await createPushToken(validToken);
    expect(mockSupabase.from).toHaveBeenCalledWith('push_tokens');
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await createPushToken({ ...validToken, beneficiary_id: '', expo_push_token: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });

  it('should return supabase error', async () => {
    mockSupabase.single.mockReturnValue({ data: null, error: { message: 'Error' } });
    const result = await createPushToken(validToken);
    expect(result.error).toEqual({ message: 'Error' });
  });
});

describe('updatePushToken', () => {
  it('should update successfully', async () => {
    const result = await updatePushToken('1', validToken);
    expect(mockSupabase.update).toHaveBeenCalled();
    expect(result.data).toBeDefined();
  });

  it('should return field errors on invalid input', async () => {
    const result = await updatePushToken('1', { ...validToken, expo_push_token: '' });
    expect(result.error).toHaveProperty('fieldErrors');
  });
});

describe('createPushToken - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/push_token.schema').PushTokenSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await createPushToken({ ...validToken, beneficiary_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('updatePushToken - empty path validation', () => {
  it('should skip validation errors with empty path[0]', async () => {
    const schema = require('@/schemas/push_token.schema').PushTokenSchema;
    const orig = schema.safeParse;
    schema.safeParse = jest.fn(() => ({
      success: false,
      error: { issues: [{ path: [], message: 'Root' }] },
    }));
    const result = await updatePushToken('1', { ...validToken, beneficiary_id: '' });
    expect((result.error as { fieldErrors: Record<string, string> }).fieldErrors).toEqual({});
    schema.safeParse = orig;
  });
});

describe('deletePushToken', () => {
  it('should delete successfully', async () => {
    mockSupabase.eq.mockReturnValue({ error: null });
    const result = await deletePushToken('1');
    expect(result.error).toBeNull();
  });

  it('should return error on failure', async () => {
    mockSupabase.eq.mockReturnValue({ error: { message: 'Error' } });
    const result = await deletePushToken('1');
    expect(result.error).toBeDefined();
  });
});
