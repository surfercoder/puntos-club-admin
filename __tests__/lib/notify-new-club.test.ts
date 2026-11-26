const mockSend = jest.fn();
jest.mock('@/lib/resend', () => ({
  resend: { emails: { send: (...args: unknown[]) => mockSend(...args) } },
  EMAIL_FROM: 'Puntos Club <soporte@puntosclub.com.ar>',
}));
const mockCapture = jest.fn();
jest.mock('@sentry/nextjs', () => ({ captureException: (...a: unknown[]) => mockCapture(...a) }));

import { notifyNewClub, NEW_CLUB_RECIPIENTS } from '@/lib/notify-new-club';

const info = {
  ownerName: 'Ana <b>',
  ownerEmail: 'ana@club.com',
  orgName: 'Café Ana',
  plan: 'trial',
  branchName: 'Centro',
  phone: '11 5555',
  address: 'Main 100, BA, CABA (1000)',
};

describe('notifyNewClub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
  });
  afterAll(() => { delete process.env.RESEND_API_KEY; });

  it('sends the owner data to both founders, escaped', async () => {
    mockSend.mockResolvedValue({ error: null });
    await notifyNewClub(info);
    const arg = mockSend.mock.calls[0][0];
    expect(arg.to).toEqual(NEW_CLUB_RECIPIENTS);
    expect(arg.to).toEqual(expect.arrayContaining(['acassani@puntosclub.com.ar', 'cjschmidt@puntosclub.com.ar']));
    expect(arg.replyTo).toBe('ana@club.com');
    expect(arg.subject).toBe('Nuevo club: Café Ana');
    expect(arg.html).toContain('tel:11 5555');
    expect(arg.html).toContain('Ana &lt;b&gt;');
  });

  it('shows a dash for missing optional fields', async () => {
    mockSend.mockResolvedValue({ error: null });
    await notifyNewClub({ ...info, ownerName: '', phone: undefined });
    expect(mockSend.mock.calls[0][0].html).toContain('—');
  });

  it('only logs to the console without RESEND_API_KEY', async () => {
    delete process.env.RESEND_API_KEY;
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    await notifyNewClub(info);
    expect(mockSend).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it.each([
    ['returns an error', () => mockSend.mockResolvedValue({ error: { message: 'boom' } })],
    ['throws', () => mockSend.mockRejectedValue(new Error('down'))],
  ])('reports to Sentry and never throws when Resend %s', async (_, arrange) => {
    arrange();
    const err = jest.spyOn(console, 'error').mockImplementation();
    await expect(notifyNewClub(info)).resolves.toBeUndefined();
    expect(mockCapture).toHaveBeenCalled();
    err.mockRestore();
  });
});
