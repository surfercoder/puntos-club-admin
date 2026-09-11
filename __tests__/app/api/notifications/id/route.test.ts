const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockFrom = jest.fn();
const mockGetUser = jest.fn();

function setupMockChain() {
  mockSingle.mockResolvedValue({ data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] }, error: null });
  mockEq.mockReturnValue({ single: mockSingle, select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

import { PATCH } from '@/app/api/notifications/[id]/route';

describe('Notifications [id] API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockChain();
  });

  it('exports a PATCH handler', () => {
    expect(typeof PATCH).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Not auth' } });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('auth.notAuthenticated');
  });

  it('returns 403 when user has no organization', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: null, role: [{ name: 'owner' }] }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('auth.noOrganization');
  });

  it('returns 403 when role is not admin or owner', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'cashier' }] }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('auth.onlyOwnersAdmins');
  });

  it('returns 403 when user has no role', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: null }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('auth.onlyOwnersAdmins');
  });

  it('returns 400 when title is missing', async () => {
    const request = {
      json: () => Promise.resolve({ body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('notifications.titleAndBodyRequired');
  });

  it('returns 400 when body is missing', async () => {
    const request = {
      json: () => Promise.resolve({ title: 'Title' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('notifications.titleAndBodyRequired');
  });

  it('returns 400 when title exceeds 65 characters', async () => {
    const request = {
      json: () => Promise.resolve({ title: 'A'.repeat(66), body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('notifications.titleTooLong');
  });

  it('returns 400 when body exceeds 240 characters', async () => {
    const request = {
      json: () => Promise.resolve({ title: 'Title', body: 'B'.repeat(241) }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('notifications.bodyTooLong');
  });

  it('updates notification successfully', async () => {
    // First call: appUser lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] }, error: null });
    // Second call: update result
    mockSingle.mockResolvedValueOnce({ data: { id: '1', title: 'Updated', body: 'Updated body', status: 'draft' }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Updated', body: 'Updated body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when update fails', async () => {
    // First call: appUser lookup
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: [{ name: 'owner' }] }, error: null });
    // Second call: update error
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });

    const request = {
      json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('notifications.updateFailed');
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = {
      json: () => Promise.resolve({ title: 'Test', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('unexpected');
  });

  it('handles role as non-array (single object)', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 1, organization_id: 1, role: { name: 'owner' } }, error: null });
    mockSingle.mockResolvedValueOnce({ data: { id: '1', title: 'Title', body: 'Body', status: 'draft' }, error: null });

    const request = {
      json: () => Promise.resolve({ title: 'Title', body: 'Body' }),
    } as any;
    const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
