import { GET } from '@/app/api/check-rls/route';

const mockRpc = jest.fn().mockResolvedValue({});
const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    rpc: mockRpc,
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({ select: mockSelect })),
  })),
}));

describe('Check RLS API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('returns RLS check info with authenticated user', async () => {
    const response = await GET();
    const data = await response.json();
    expect(data).toHaveProperty('authUser', 'u1');
    expect(data).toHaveProperty('authQuery');
    expect(data).toHaveProperty('message');
    expect(mockRpc).toHaveBeenCalledWith('check_rls_status');
  });

  it('returns "none" when no auth user', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const response = await GET();
    const data = await response.json();
    expect(data.authUser).toBe('none');
  });

  it('reports auth query error', async () => {
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'RLS blocked' } });
    const response = await GET();
    const data = await response.json();
    expect(data.authQuery.error).toEqual({ message: 'RLS blocked' });
  });

  it('handles exception with Error instance and returns error', async () => {
    mockRpc.mockRejectedValueOnce(new Error('RPC failed'));
    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('RPC failed');
  });

  it('handles exception with non-Error and returns "Unknown error"', async () => {
    mockRpc.mockRejectedValueOnce('string error');
    const response = await GET();
    const data = await response.json();
    expect(data.error).toBe('Unknown error');
  });
});
