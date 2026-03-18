import { verifyCaptchaToken } from '@/actions/onboarding/verify-captcha';

const originalEnv = process.env;
const mockFetch = global.fetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: 'test-secret' };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('verifyCaptchaToken', () => {
  it('should return success when captcha is valid', async () => {
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    });
    const result = await verifyCaptchaToken('valid-token');
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.google.com/recaptcha/api/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
    );
  });

  it('should return error when captcha is invalid', async () => {
    mockFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: false }),
    });
    const result = await verifyCaptchaToken('invalid-token');
    expect(result).toEqual({ success: false, error: 'Verificación fallida. Intentá de nuevo.' });
  });

  it('should return error when secret key not configured', async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    const result = await verifyCaptchaToken('token');
    expect(result).toEqual({ success: false, error: 'Captcha not configured' });
  });

  it('should return error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await verifyCaptchaToken('token');
    expect(result).toEqual({ success: false, error: 'Error al verificar el captcha.' });
  });
});
