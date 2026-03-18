import { GET } from '@/app/api/find-user/route';

const mockEqResult = jest.fn().mockResolvedValue({ data: [{ id: 1, email: 'test@test.com' }], error: null });
const mockLimit = jest.fn().mockResolvedValue({ data: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', created_at: '2024-01-01' }], error: null });
const mockOrder = jest.fn(() => ({ limit: mockLimit }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: mockEqResult,
        order: mockOrder,
      })),
    })),
  })),
}));

describe('Find User API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEqResult.mockResolvedValue({ data: [{ id: 1, email: 'test@test.com' }], error: null });
    mockLimit.mockResolvedValue({ data: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', created_at: '2024-01-01' }], error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns results for email search', async () => {
    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data).toHaveProperty('searchEmail', 'test@test.com');
    expect(data.appUser).toHaveProperty('found');
    expect(data.beneficiary).toHaveProperty('found');
    expect(data.recentUsers).toHaveProperty('count');
  });

  it('uses default email when none provided', async () => {
    const request = { url: 'http://localhost:3001/api/find-user' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.searchEmail).toBe('fede@owner.com');
  });

  it('reports when user is found', async () => {
    mockEqResult.mockResolvedValueOnce({ data: [{ id: 1, email: 'test@test.com' }], error: null });
    mockEqResult.mockResolvedValueOnce({ data: [{ id: 1, email: 'test@test.com' }], error: null });

    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.appUser.found).toBe(true);
    expect(data.appUser.count).toBe(1);
  });

  it('reports when no user found', async () => {
    mockEqResult.mockResolvedValueOnce({ data: [], error: null });
    mockEqResult.mockResolvedValueOnce({ data: [], error: null });

    const request = { url: 'http://localhost:3001/api/find-user?email=nobody@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.appUser.found).toBe(false);
    expect(data.appUser.count).toBe(0);
  });

  it('handles null data (no data returned)', async () => {
    mockEqResult.mockResolvedValueOnce({ data: null, error: null });
    mockEqResult.mockResolvedValueOnce({ data: null, error: null });
    mockLimit.mockResolvedValueOnce({ data: null, error: null });

    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.appUser.found).toBeFalsy();
    expect(data.appUser.count).toBe(0);
    expect(data.recentUsers.count).toBe(0);
  });

  it('includes errors in response when queries fail', async () => {
    mockEqResult.mockResolvedValueOnce({ data: null, error: { message: 'Query error' } });
    mockEqResult.mockResolvedValueOnce({ data: null, error: { message: 'Query error 2' } });
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'Query error 3' } });

    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.appUser.error).toEqual({ message: 'Query error' });
    expect(data.beneficiary.error).toEqual({ message: 'Query error 2' });
    expect(data.recentUsers.error).toEqual({ message: 'Query error 3' });
  });

  it('handles errors gracefully (catch block with Error)', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce(new Error('DB error'));

    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.error).toBe('DB error');
    expect(data.stack).toBeDefined();
  });

  it('handles errors gracefully (catch block with non-Error)', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce('string error');

    const request = { url: 'http://localhost:3001/api/find-user?email=test@test.com' } as Request;
    const response = await GET(request);
    const data = await response.json();
    expect(data.error).toBe('Unknown error');
    expect(data.stack).toBeUndefined();
  });
});
