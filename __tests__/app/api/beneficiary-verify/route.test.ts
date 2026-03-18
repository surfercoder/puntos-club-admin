import { POST } from '@/app/api/beneficiary/verify/route';

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

describe('Beneficiary Verify API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockSingle.mockResolvedValue({ data: { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '123', available_points: 100 }, error: null });
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {
      json: () => Promise.resolve({ email: 'test@test.com' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it('returns 400 when no userId or email', async () => {
    const request = {
      json: () => Promise.resolve({}),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId or email is required');
  });

  it('returns 404 when beneficiary not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    const request = {
      json: () => Promise.resolve({ email: 'nobody@test.com' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toBe('Beneficiary not found');
  });

  it('returns beneficiary data on success', async () => {
    const request = {
      json: () => Promise.resolve({ email: 'john@test.com' }),
      headers: { get: () => null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe('john@test.com');
  });

  it('uses Bearer token auth for mobile apps', async () => {
    const request = {
      json: () => Promise.resolve({ email: 'john@test.com' }),
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer test-token' : null },
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    const request = {
      json: () => { throw new Error('boom'); },
      headers: { get: () => null },
    } as any;
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
