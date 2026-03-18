import { GET } from '@/app/api/beneficiary/[id]/purchases/route';

const mockLimit = jest.fn();
const mockOrder = jest.fn(() => ({ limit: mockLimit }));
const mockEq = jest.fn(() => ({ order: mockOrder }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

describe('Beneficiary Purchases API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    mockLimit.mockResolvedValue({
      data: [
        { id: 1, total_amount: 100, points_earned: 200, cashier: { first_name: 'John', last_name: 'Doe' }, branch: { name: 'Main' } },
      ],
      error: null,
    });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns 400 for invalid beneficiary ID', async () => {
    const request = new Request('http://localhost:3001/api/beneficiary/abc/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: 'abc' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid beneficiary ID');
  });

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Unauthorized' } });

    const request = new Request('http://localhost:3001/api/beneficiary/1/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns purchases for valid beneficiary ID', async () => {
    const request = new Request('http://localhost:3001/api/beneficiary/1/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].total_amount).toBe(100);
  });

  it('returns 500 when query fails', async () => {
    mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

    const request = new Request('http://localhost:3001/api/beneficiary/1/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch purchases');
  });

  it('returns empty array when no purchases exist', async () => {
    mockLimit.mockResolvedValueOnce({ data: [], error: null });

    const request = new Request('http://localhost:3001/api/beneficiary/1/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = new Request('http://localhost:3001/api/beneficiary/1/purchases');
    const response = await GET(request as any, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
