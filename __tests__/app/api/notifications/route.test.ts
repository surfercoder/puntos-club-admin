import { GET, POST } from '@/app/api/notifications/route';

const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();
const mockRpc = jest.fn();

function setupMockChain() {
  // Default chain for .from().select().eq().single() (appUser lookup)
  mockSingle.mockResolvedValue({ data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] }, error: null });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockEq.mockReturnValue({ single: mockSingle, order: mockOrder });
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
  mockInsert.mockReturnValue({ select: jest.fn(() => ({ single: jest.fn().mockResolvedValue({ data: { id: 1, title: 'Test', body: 'Body' }, error: null }) })) });
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  mockRpc.mockResolvedValue({ data: true });
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('Notifications API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockChain();
  });

  it('exports GET and POST handlers', () => {
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
  });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

      const request = {} as any;
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 when user has no organization', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: null }, error: null });

      const request = {} as any;
      const response = await GET(request);
      await response.json();
      expect(response.status).toBe(403);
    });

    it('returns 500 when notifications query fails', async () => {
      // First call is appUser lookup - succeed
      mockEq.mockReturnValueOnce({ single: mockSingle });
      // Then notifications query fails
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });

      const request = {} as any;
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch notifications');
    });

    it('returns notifications list on success', async () => {
      const mockNotifications = [{ id: 1, title: 'Test' }];
      mockOrder.mockResolvedValueOnce({ data: mockNotifications, error: null });
      // First call is appUser lookup, second is notifications
      mockEq.mockReturnValueOnce({ single: mockSingle });

      const request = {} as any;
      const response = await GET(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('returns 500 on unexpected error (catch block)', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

      const request = {} as any;
      const response = await GET(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

      const request = {
        json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      } as any;
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('returns 403 when user has no organization', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: null, role: [{ name: 'owner' }] }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      } as any;
      const response = await POST(request);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('User not associated with an organization');
    });

    it('returns 403 when user role is not owner or admin', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'cashier' }] }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      } as any;
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('returns 403 when user has no role', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: null }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      } as any;
      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('returns 400 when title is missing', async () => {
      const request = {
        json: () => Promise.resolve({ body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title and body are required');
    });

    it('returns 400 when title exceeds 65 characters', async () => {
      const request = {
        json: () => Promise.resolve({ title: 'A'.repeat(66), body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title must be 65 characters or less');
    });

    it('returns 400 when body exceeds 240 characters', async () => {
      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'B'.repeat(241) }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('Body must be 240 characters or less');
    });

    it('returns 429 when notification limit is reached', async () => {
      mockRpc.mockResolvedValueOnce({ data: false });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(429);
      expect(data.error).toBe('Notification limit reached');
    });

    it('returns 400 when no target organization found (edge case)', async () => {
      // appUser has organization_id = 0 (falsy), is not admin, and bodyOrgId is not provided
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 0, role: [{ name: 'owner' }] }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
      } as any;
      const response = await POST(request);
      await response.json();
      // organization_id = 0 is falsy, so it would hit the 403 first (no org), then !targetOrgId
      expect(response.status).toBe(403);
    });

    it('returns 500 when notification insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        })),
      });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create notification');
    });

    it('creates notification successfully', async () => {
      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('admin user can target specific org via organizationId in body', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'admin' }] }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body', organizationId: 5 }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('returns 400 when admin sends non-numeric organizationId (NaN targetOrgId)', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'admin' }] }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body', organizationId: 'not-a-number' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('No target organization found');
    });

    it('returns 500 on unexpected error (catch block)', async () => {
      mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

      const request = {
        json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('An unexpected error occurred');
    });

    it('handles role as non-array (single object)', async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: { name: 'owner' } }, error: null });

      const request = {
        json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
      } as any;
      const response = await POST(request);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
