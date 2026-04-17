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

  it('exports EMAIL_FROM constant', () => {
    const { EMAIL_FROM } = require('@/lib/resend');
    expect(EMAIL_FROM).toBe('Puntos Club <hola@puntosclub.com.ar>');
  });
});
