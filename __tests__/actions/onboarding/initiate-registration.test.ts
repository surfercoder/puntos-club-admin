jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({}),
  })),
}));
jest.mock('@/lib/registration-token', () => ({
  createRegistrationToken: jest.fn(() => 'mock-token-123'),
}));

import { initiateRegistration } from '@/actions/onboarding/initiate-registration';
import { createRegistrationToken } from '@/lib/registration-token';
import nodemailer from 'nodemailer';

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
  it('should succeed in dev mode (no email credentials)', async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    expect(createRegistrationToken).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should send email when credentials configured', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: 'gmail',
      auth: { user: 'test@gmail.com', pass: 'app-password' },
    });
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

  it('should return error when email sending fails', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: false, error: 'No se pudo enviar el email de verificación.' });
    consoleSpy.mockRestore();
  });

  it('should use default site URL when env not set', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const result = await initiateRegistration(validInput);
    expect(result).toEqual({ success: true });
    consoleSpy.mockRestore();
  });
});
