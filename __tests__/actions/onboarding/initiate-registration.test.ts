const mockSend = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...args: unknown[]) => mockSend(...args) } },
  EMAIL_FROM: 'Puntos Club <soporte@puntosclub.com.ar>',
}));
jest.mock('@/lib/registration-token', () => ({
  createRegistrationToken: jest.fn(() => 'mock-token-123'),
}));

import { initiateRegistration } from '@/actions/onboarding/initiate-registration';
import { createRegistrationToken } from '@/lib/registration-token';

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, NEXT_PUBLIC_SITE_URL: 'https://example.com' };
  (createRegistrationToken as jest.Mock).mockReturnValue('mock-token-123');
});

afterAll(() => {
  process.env = originalEnv;
});

const validInput = {
  email: 'test@test.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'password123',
  redirectTo: '/onboarding',
};

describe('initiateRegistration', () => {
  it('should succeed in dev mode (no RESEND_API_KEY)', async () => {
    delete process.env.RESEND_API_KEY;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    expect(createRegistrationToken).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should send email when RESEND_API_KEY is configured', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Puntos Club <soporte@puntosclub.com.ar>',
        to: 'test@test.com',
        subject: 'Confirma tu email - Puntos Club',
      })
    );
  });

  it('should return error when token creation fails', async () => {
    (createRegistrationToken as jest.Mock).mockImplementation(() => {
      throw new Error('Token error');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: false, error: 'Error de configuración del servidor.' });
    consoleSpy.mockRestore();
  });

  it('should return error when Resend returns an error object', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: false, error: 'No se pudo enviar el email de verificación.' });
    consoleSpy.mockRestore();
  });

  it('should return error when email sending throws', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: false, error: 'No se pudo enviar el email de verificación.' });
    consoleSpy.mockRestore();
  });

  it('should use default site URL when env not set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.RESEND_API_KEY;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    consoleSpy.mockRestore();
  });
});
