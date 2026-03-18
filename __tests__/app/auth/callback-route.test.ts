import { GET } from '@/app/auth/callback/route';

const mockExchangeCodeForSession = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

describe('Auth Callback Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('redirects to dashboard on successful code exchange', async () => {
    const request = { url: 'http://localhost:3001/auth/callback?code=test-code' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/dashboard');
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-code');
  });

  it('redirects to custom next URL on success', async () => {
    const request = { url: 'http://localhost:3001/auth/callback?code=test-code&next=/settings' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/settings');
  });

  it('redirects to error page when no code', async () => {
    const request = { url: 'http://localhost:3001/auth/callback' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });

  it('redirects to error page when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'Invalid code' } });

    const request = { url: 'http://localhost:3001/auth/callback?code=bad-code' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });
});
