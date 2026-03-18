import { POST } from '@/app/api/push-tokens/route';

const mockSingle = jest.fn();
const mockEqChain = jest.fn(() => ({ single: mockSingle, eq: mockEqChain }));
const mockSelect = jest.fn(() => ({ eq: mockEqChain }));
const mockUpdateSingle = jest.fn();
const mockUpdate = jest.fn(() => ({
  eq: jest.fn(() => ({
    select: jest.fn(() => ({
      single: mockUpdateSingle,
    })),
  })),
}));
const mockInsertSingle = jest.fn();
const mockInsert = jest.fn(() => ({
  select: jest.fn(() => ({
    single: mockInsertSingle,
  })),
}));
const mockFrom = jest.fn(() => ({ select: mockSelect, update: mockUpdate, insert: mockInsert }));
const mockGetUser = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

describe('Push Tokens API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // beneficiary lookup
    mockSingle.mockResolvedValue({ data: { id: 1 }, error: null });
    mockUpdateSingle.mockResolvedValue({ data: { id: 1, expo_push_token: 'token123', is_active: true }, error: null });
    mockInsertSingle.mockResolvedValue({ data: { id: 2, expo_push_token: 'token123', is_active: true }, error: null });
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when no auth header', async () => {
    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token123' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Missing authorization header');
  });

  it('returns 401 when user auth fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Invalid token' } });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token123' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer bad-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 404 when beneficiary not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token123' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Beneficiary not found');
  });

  it('returns 400 when expoPushToken is missing', async () => {
    const request = {
      json: () => Promise.resolve({}),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('expoPushToken is required');
  });

  it('updates existing token when found', async () => {
    // beneficiary lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // existing token lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 5, expo_push_token: 'token123' }, error: null });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token123', deviceId: 'dev1', platform: 'ios' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when update fails', async () => {
    // beneficiary lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // existing token lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 5, expo_push_token: 'token123' }, error: null });
    // update fails
    mockUpdateSingle.mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token123', deviceId: 'dev1', platform: 'ios' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to update push token');
  });

  it('creates new token when not existing', async () => {
    // beneficiary lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // existing token lookup - not found
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'new-token', deviceId: 'dev1', platform: 'android' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when insert fails', async () => {
    // beneficiary lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    // existing token lookup - not found
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    // insert fails
    mockInsertSingle.mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'new-token', deviceId: 'dev1', platform: 'android' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to create push token');
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = {
      json: () => Promise.resolve({ expoPushToken: 'token' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer valid-token' : null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('An unexpected error occurred');
  });
});
