jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn() } })),
}));

describe('lib/resend', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, RESEND_API_KEY: 're_test_key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports a Resend instance', () => {
    const { resend } = require('@/lib/resend');
    expect(resend).toBeDefined();
  });

  it('falls back to onboarding@resend.dev when EMAIL_FROM env is unset', () => {
    delete process.env.EMAIL_FROM;
    const { EMAIL_FROM } = require('@/lib/resend');
    expect(EMAIL_FROM).toBe('Puntos Club <onboarding@resend.dev>');
  });

  it('uses EMAIL_FROM env value when set', () => {
    process.env.EMAIL_FROM = 'Puntos Club <soporte@puntosclub.com.ar>';
    const { EMAIL_FROM } = require('@/lib/resend');
    expect(EMAIL_FROM).toBe('Puntos Club <soporte@puntosclub.com.ar>');
  });
});
