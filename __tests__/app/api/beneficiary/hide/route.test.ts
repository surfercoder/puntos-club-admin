const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { POST } from '@/app/api/beneficiary/hide/route';
import { getCurrentUser } from '@/lib/auth/get-current-user';

function setupMockChain() {
  mockSingle.mockResolvedValue({ data: { id: 1 }, error: null });
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockInsert.mockResolvedValue({ error: null });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate, insert: mockInsert });
  (getCurrentUser as jest.Mock).mockResolvedValue({ organization_id: 1 });
}

describe('Beneficiary Hide API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMockChain();
  });

  it('exports a POST handler', () => {
    expect(typeof POST).toBe('function');
  });

  it('returns 401 when not authenticated', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(null);

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when missing beneficiary_id', async () => {
    const request = {
      json: () => Promise.resolve({ organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('beneficiary_id, organization_id, and is_hidden are required');
  });

  it('returns 400 when missing organization_id', async () => {
    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('beneficiary_id, organization_id, and is_hidden are required');
  });

  it('returns 400 when is_hidden is not boolean', async () => {
    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: 'yes' }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe('beneficiary_id, organization_id, and is_hidden are required');
  });

  it('returns 403 when org does not match', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValueOnce({ organization_id: 2 });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe('You can only hide beneficiaries from your own organization');
  });

  it('updates existing record successfully', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 10 }, error: null });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('inserts new record when no existing record found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('returns 500 when update fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 10 }, error: null });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }) });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Update failed');
  });

  it('returns 500 when insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } });
    mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert });

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('Insert failed');
  });

  it('returns 500 on unexpected error (catch block)', async () => {
    (getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Unexpected'));

    const request = {
      json: () => Promise.resolve({ beneficiary_id: 1, organization_id: 1, is_hidden: true }),
    } as any;
    const response = await POST(request);
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe('An unexpected error occurred');
  });
});
