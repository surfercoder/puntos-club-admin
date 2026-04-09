describe('lib/env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('parses successfully with all required env vars', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
    expect(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).toBe('maps-api-key');
    expect(env.MERCADOPAGO_ACCESS_TOKEN).toBe('TEST-mp-access-token');
  });

  it('includes optional fields when provided', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
      NEXT_PUBLIC_SITE_URL: 'https://mysite.com',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      REGISTRATION_SECRET: 'a-long-enough-secret',
      MP_PLAN_ID_ADVANCE: 'plan-advance-id',
      MP_PLAN_ID_PRO: 'plan-pro-id',
      MP_WEBHOOK_SECRET: 'webhook-secret',
    };
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://mysite.com');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key');
    expect(env.REGISTRATION_SECRET).toBe('a-long-enough-secret');
    expect(env.MP_PLAN_ID_ADVANCE).toBe('plan-advance-id');
    expect(env.MP_PLAN_ID_PRO).toBe('plan-pro-id');
    expect(env.MP_WEBHOOK_SECRET).toBe('webhook-secret');
  });

  it('optional fields are undefined when not provided', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.REGISTRATION_SECRET;
    delete process.env.MP_PLAN_ID_ADVANCE;
    delete process.env.MP_PLAN_ID_PRO;
    delete process.env.MP_WEBHOOK_SECRET;
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.REGISTRATION_SECRET).toBeUndefined();
    expect(env.MP_PLAN_ID_ADVANCE).toBeUndefined();
    expect(env.MP_PLAN_ID_PRO).toBeUndefined();
    expect(env.MP_WEBHOOK_SECRET).toBeUndefined();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
    };
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(() => require('@/lib/env')).toThrow();
  });

  it('treats empty NEXT_PUBLIC_SITE_URL as undefined', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      NEXT_PUBLIC_SITE_URL: '',
    };
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it('treats empty-string optionalString fields as undefined', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      SUPABASE_SERVICE_ROLE_KEY: '',
      REGISTRATION_SECRET: '',
      MERCADOPAGO_ACCESS_TOKEN: '',
      MP_PLAN_ID_ADVANCE: '',
      MP_PLAN_ID_PRO: '',
      MP_WEBHOOK_SECRET: '',
    };
    const { env } = require('@/lib/env');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.REGISTRATION_SECRET).toBeUndefined();
    expect(env.MERCADOPAGO_ACCESS_TOKEN).toBeUndefined();
    expect(env.MP_PLAN_ID_ADVANCE).toBeUndefined();
    expect(env.MP_PLAN_ID_PRO).toBeUndefined();
    expect(env.MP_WEBHOOK_SECRET).toBeUndefined();
  });

  it('throws when NEXT_PUBLIC_SITE_URL is provided but not a valid URL', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      MERCADOPAGO_ACCESS_TOKEN: 'TEST-mp-access-token',
      NEXT_PUBLIC_SITE_URL: 'not-a-url',
    };
    expect(() => require('@/lib/env')).toThrow();
  });

});
