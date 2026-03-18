import { GET } from '@/app/auth/complete-registration/route';

const mockCreateUser = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: { admin: { createUser: mockCreateUser } },
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    auth: { signInWithPassword: mockSignInWithPassword },
  })),
}));

jest.mock('@/lib/registration-token', () => ({
  verifyRegistrationToken: jest.fn((token: string) => {
    if (token === 'valid') return { email: 'test@test.com', password: 'pass123', firstName: 'Test', lastName: 'User', redirectTo: '/owner/onboarding?step=2' };
    return null;
  }),
}));

describe('Complete Registration Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUser.mockResolvedValue({ error: null });
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  it('exports a GET handler', () => {
    expect(typeof GET).toBe('function');
  });

  it('redirects to error when no token', async () => {
    const request = { url: 'http://localhost:3001/auth/complete-registration' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });

  it('redirects to error when token is invalid', async () => {
    const request = { url: 'http://localhost:3001/auth/complete-registration?token=invalid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
    expect(response.headers.get('location')).toContain('invalid_or_expired_token');
  });

  it('creates user and signs in when token is valid', async () => {
    const request = { url: 'http://localhost:3001/auth/complete-registration?token=valid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/owner/onboarding');
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@test.com',
        password: 'pass123',
        email_confirm: true,
      })
    );
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'pass123',
    });
  });

  it('treats "already registered" as OK', async () => {
    mockCreateUser.mockResolvedValueOnce({
      error: { message: 'A user with this email address has already been registered' },
    });

    const request = { url: 'http://localhost:3001/auth/complete-registration?token=valid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/owner/onboarding');
  });

  it('redirects to error when createUser fails with other error', async () => {
    mockCreateUser.mockResolvedValueOnce({
      error: { message: 'Database connection failed' },
    });

    const request = { url: 'http://localhost:3001/auth/complete-registration?token=valid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });

  it('redirects to error when signIn fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
    });

    const request = { url: 'http://localhost:3001/auth/complete-registration?token=valid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });

  it('redirects to error on unexpected exception', async () => {
    mockCreateUser.mockRejectedValueOnce(new Error('Unexpected'));

    const request = { url: 'http://localhost:3001/auth/complete-registration?token=valid' } as Request;
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/error');
  });
});
