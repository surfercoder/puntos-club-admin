import { redirect } from 'next/navigation';
import { GET } from '@/app/auth/confirm/route';

const mockVerifyOtp = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { verifyOtp: mockVerifyOtp },
  })),
}));

describe('Auth Confirm Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtp.mockResolvedValue({ error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('redirects to error when no token_hash', async () => {
    const request = { url: 'http://localhost:3001/auth/confirm' } as any;
    await GET(request);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/error'));
  });

  it('redirects to error when no type param', async () => {
    const request = { url: 'http://localhost:3001/auth/confirm?token_hash=abc' } as any;
    await GET(request);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/error'));
  });

  it('calls verifyOtp and redirects on success', async () => {
    const request = { url: 'http://localhost:3001/auth/confirm?token_hash=abc&type=email' } as any;
    await GET(request);
    expect(mockVerifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('redirects to custom next URL on success', async () => {
    const request = { url: 'http://localhost:3001/auth/confirm?token_hash=abc&type=email&next=/dashboard' } as any;
    await GET(request);
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to error page when OTP verification fails', async () => {
    mockVerifyOtp.mockResolvedValueOnce({ error: { message: 'Token expired' } });

    const request = { url: 'http://localhost:3001/auth/confirm?token_hash=abc&type=email' } as any;
    await GET(request);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/auth/error'));
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('Token expired'));
  });
});
