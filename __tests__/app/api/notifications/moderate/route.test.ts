import { POST } from '@/app/api/notifications/moderate/route';

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockGetUser = jest.fn();
const mockModerate = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

jest.mock('@/lib/ai/content-moderator', () => ({
  moderateNotificationContent: (...args: unknown[]) => mockModerate(...args),
}));

describe('Notification Moderate API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' };
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockSingle.mockResolvedValue({ data: { id: 1, organization_id: 1, role: { name: 'owner' } }, error: null });
    mockModerate.mockResolvedValue({ approved: true, reason: '' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user has no organization', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: null }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 403 when user is not owner or admin', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: { name: 'cashier' } }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 403 when user has no role', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: null }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 400 when title or body is missing', async () => {
    const request = {
      json: () => Promise.resolve({ title: '' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 503 when ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  it('returns moderation result on success', async () => {
    mockModerate.mockResolvedValueOnce({ approved: true, reason: '' });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.approved).toBe(true);
    expect(mockModerate).toHaveBeenCalledWith('Test', 'Body');
  });

  it('returns 500 when moderation throws Error instance', async () => {
    mockModerate.mockRejectedValueOnce(new Error('AI service down'));

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('AI service down');
  });

  it('returns 500 with default message when moderation throws non-Error', async () => {
    mockModerate.mockRejectedValueOnce('some string error');

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Ocurrió un error inesperado durante la moderación');
  });

  it('handles role as array', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'admin' }] }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
