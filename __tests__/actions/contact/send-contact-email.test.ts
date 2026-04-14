const mockSend = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...args: unknown[]) => mockSend(...args) } },
  EMAIL_FROM: 'Puntos Club <hola@puntosclub.com.ar>',
}));

jest.mock('@/lib/email-template', () => ({
  brandedEmailLayout: jest.fn((body: string) => `<html>${body}</html>`),
  sectionHeading: jest.fn((text: string) => `<h2>${text}</h2>`),
  subtitle: jest.fn((text: string) => `<p>${text}</p>`),
  dataTable: jest.fn(() => '<table></table>'),
  messageBox: jest.fn(() => '<div>message</div>'),
}));

import { sendContactEmail } from '@/actions/contact/send-contact-email';

const validInput = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '1234567890',
  message: 'This is a test message that is long enough to pass validation for the contact form.',
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.RESEND_API_KEY;
});

describe('sendContactEmail', () => {
  it('should return error for invalid form data', async () => {
    const result = await sendContactEmail({
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      phoneNumber: '',
      message: '',
    });
    expect(result).toEqual({ success: false, error: 'Invalid form data.' });
  });

  it('should succeed without sending email when no RESEND_API_KEY', async () => {
    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should send email when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Puntos Club <hola@puntosclub.com.ar>',
        to: 'acassani@puntosclub.com.ar',
        subject: 'Nueva consulta de John Doe',
      })
    );
  });

  it('should send email with business field in rows when provided', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    const result = await sendContactEmail({ ...validInput, business: 'ACME Corp' });
    expect(result).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalled();
  });

  it('should return error when Resend returns an error object', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: null, error: { message: 'API error' } });

    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: false, error: 'Failed to send contact email.' });
  });

  it('should return error when send throws', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockRejectedValue(new Error('Network error'));

    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: false, error: 'Failed to send contact email.' });
  });
});
