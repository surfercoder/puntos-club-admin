import { GET } from '@/app/api/notifications/limits/route';

const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockInsertSingle = jest.fn();
const mockInsertSelect = jest.fn(() => ({ single: mockInsertSingle }));
const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));
const mockFrom = jest.fn(() => ({ select: mockSelect, insert: mockInsert }));
const mockGetUser = jest.fn();
const mockRpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('Notification Limits API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // First call: app_user lookup
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // Second call: limits lookup
    mockSingle.mockResolvedValueOnce({ data: { plan_type: 'free', daily_limit: 1, monthly_limit: 5 }, error: null });
    mockRpc.mockResolvedValue({ data: true });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockReset();
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {} as any;
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when user has no organization', async () => {
    mockSingle.mockReset();
    mockSingle.mockResolvedValueOnce({ data: { organization_id: null }, error: null });

    const request = {} as any;
    const response = await GET(request);
    await response.json();
    expect(response.status).toBe(403);
  });

  it('returns limits with can_send_now when limits exist', async () => {
    const request = {} as any;
    const response = await GET(request);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('can_send_now', true);
    expect(data.data).toHaveProperty('plan_type', 'free');
  });

  it('creates default limits when none exist', async () => {
    mockSingle.mockReset();
    // app_user lookup
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // limits lookup - not found (PGRST116 = row not found)
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    // insert default limits
    mockInsertSingle.mockResolvedValueOnce({ data: { plan_type: 'free', daily_limit: 1, monthly_limit: 5 } });

    const request = {} as any;
    const response = await GET(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 on database error (non-PGRST116)', async () => {
    mockSingle.mockReset();
    // app_user lookup
    mockSingle.mockResolvedValueOnce({ data: { organization_id: 1 }, error: null });
    // limits lookup - real error
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST500', message: 'DB error' } });

    const request = {} as any;
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch limits');
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockReset();
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = {} as any;
    const response = await GET(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
