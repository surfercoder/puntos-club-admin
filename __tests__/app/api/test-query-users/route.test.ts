import { GET } from '@/app/api/test-query-users/route';

const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: mockOrder,
      })),
    })),
  })),
}));

describe('Test Query Users API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns query results', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toHaveProperty('simpleQuery');
    expect(data).toHaveProperty('relatedQuery');
  });

  it('handles errors gracefully (catch block with Error)', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce(new Error('Connection failed'));

    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('Connection failed');
    expect(data.stack).toBeDefined();
  });

  it('handles errors gracefully (catch block with non-Error)', async () => {
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockRejectedValueOnce('string error');

    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('Unknown error');
    expect(data.stack).toBeUndefined();
  });

  it('returns data with sample when results exist', async () => {
    const sampleUser = { id: 1, email: 'test@test.com', first_name: 'Test' };
    mockOrder.mockResolvedValueOnce({ data: [sampleUser], error: null });
    mockOrder.mockResolvedValueOnce({ data: [{ ...sampleUser, organization: { id: 1, name: 'Org' } }], error: null });

    const response = await GET();
    const data = await response.json();
    expect(data.simpleQuery.count).toBe(1);
    expect(data.simpleQuery.sample).toEqual(sampleUser);
    expect(data.relatedQuery.count).toBe(1);
  });

  it('returns error info when queries fail', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error 2' } });

    const response = await GET();
    const data = await response.json();
    expect(data.simpleQuery.error).toEqual({ message: 'DB error' });
    expect(data.simpleQuery.count).toBe(0);
    expect(data.relatedQuery.error).toEqual({ message: 'DB error 2' });
  });
});
