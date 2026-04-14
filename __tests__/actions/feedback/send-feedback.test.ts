const mockSend = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...args: unknown[]) => mockSend(...args) } },
  EMAIL_FROM: 'Puntos Club <hola@puntosclub.com.ar>',
}));

import { sendFeedback } from '@/actions/feedback/send-feedback';

describe('sendFeedback', () => {
  const validInput = {
    type: 'feedback' as const,
    message: 'Great app!',
    userEmail: 'user@example.com',
    userName: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it('returns error when message is empty', async () => {
    const result = await sendFeedback({
      ...validInput,
      message: '   ',
    });

    expect(result).toEqual({ success: false, error: 'Message is required.' });
  });

  it('returns success without sending email when RESEND_API_KEY is not set', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: true });
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('sends email and returns success when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Puntos Club <hola@puntosclub.com.ar>',
        to: 'acassani@puntosclub.com.ar',
        replyTo: 'user@example.com',
        subject: '[Feedback] Feedback de Test User',
      })
    );
  });

  it('uses correct type labels in subject', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    await sendFeedback({ ...validInput, type: 'error' });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Error] Feedback de Test User',
      })
    );
  });

  it('returns error when Resend returns an error object', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: null, error: { message: 'API error' } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: false, error: 'Failed to send feedback.' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('returns error when send throws', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await sendFeedback(validInput);

    expect(result).toEqual({ success: false, error: 'Failed to send feedback.' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('includes message content in HTML body', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    await sendFeedback(validInput);

    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('Great app!');
    expect(call.html).toContain('Test User');
    expect(call.html).toContain('user@example.com');
    expect(call.html).toContain('Feedback');
  });

  it('uses type as label and default color when type is unknown', async () => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    await sendFeedback({ ...validInput, type: 'unknown_type' as any });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[unknown_type] Feedback de Test User',
      })
    );
    const call = mockSend.mock.calls[0][0];
    expect(call.html).toContain('unknown_type');
  });

  it.each([
    ['comment', 'Comentario'],
    ['feedback', 'Feedback'],
    ['error', 'Error'],
    ['improvement', 'Mejora'],
    ['question', 'Pregunta'],
  ] as const)('maps type "%s" to label "%s"', async (type, label) => {
    process.env.RESEND_API_KEY = 're_test_key';
    mockSend.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

    await sendFeedback({ ...validInput, type: type as any });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `[${label}] Feedback de Test User`,
      })
    );
  });
});
