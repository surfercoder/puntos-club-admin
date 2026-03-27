const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
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
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;
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

  it('should succeed without sending email when no GMAIL credentials', async () => {
    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: true });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('should send email when GMAIL credentials are set', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'secret';
    mockSendMail.mockResolvedValue({ messageId: '123' });

    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: true });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'acassani@puntosclub.com.ar',
        subject: 'Nueva consulta de John Doe',
      })
    );
  });

  it('should send email with business field in rows when provided', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'secret';
    mockSendMail.mockResolvedValue({ messageId: '123' });

    const result = await sendContactEmail({ ...validInput, business: 'ACME Corp' });
    expect(result).toEqual({ success: true });
    expect(mockSendMail).toHaveBeenCalled();
  });

  it('should return error when nodemailer fails', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'secret';
    mockSendMail.mockRejectedValue(new Error('SMTP error'));

    const result = await sendContactEmail(validInput);
    expect(result).toEqual({ success: false, error: 'Failed to send contact email.' });
  });
});
