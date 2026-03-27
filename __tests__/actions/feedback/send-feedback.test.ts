import { sendFeedback } from '@/actions/feedback/send-feedback';

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('sendFeedback', () => {
  const validInput = {
    type: 'feedback' as const,
    message: 'Great app!',
    userEmail: 'user@example.com',
    userName: 'Test User',
  };

  beforeEach(() => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;
  });

  it('returns error when message is empty', async () => {
    const result = await sendFeedback({
      ...validInput,
      message: '   ',
    });

    expect(result).toEqual({ success: false, error: 'Message is required.' });
  });

  it('returns success without sending email when GMAIL credentials are not set', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: true });
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('sends email and returns success when credentials are set', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockResolvedValue({});

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: true });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Puntos Club Feedback" <test@gmail.com>',
        to: 'acassani@puntosclub.com.ar',
        replyTo: 'user@example.com',
        subject: '[Feedback] Feedback de Test User',
      })
    );
  });

  it('uses correct type labels in subject', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockResolvedValue({});

    await sendFeedback({ ...validInput, type: 'error' });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Error] Feedback de Test User',
      })
    );
  });

  it('returns error when sendMail throws', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: false, error: 'Failed to send feedback.' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('includes message content in HTML body', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockResolvedValue({});

    await sendFeedback(validInput);

    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('Great app!');
    expect(call.html).toContain('Test User');
    expect(call.html).toContain('user@example.com');
    expect(call.html).toContain('Feedback');
  });

  it('uses type as label and default color when type is unknown', async () => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockResolvedValue({});

    await sendFeedback({ ...validInput, type: 'unknown_type' as any });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[unknown_type] Feedback de Test User',
      })
    );
    // The HTML should contain the unknown type as the label
    const call = mockSendMail.mock.calls[0][0];
    expect(call.html).toContain('unknown_type');
  });

  it.each([
    ['comment', 'Comentario'],
    ['feedback', 'Feedback'],
    ['error', 'Error'],
    ['improvement', 'Mejora'],
    ['question', 'Pregunta'],
  ] as const)('maps type "%s" to label "%s"', async (type, label) => {
    process.env.GMAIL_USER = 'test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    mockSendMail.mockResolvedValue({});

    await sendFeedback({ ...validInput, type: type as any });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `[${label}] Feedback de Test User`,
      })
    );
  });
});
