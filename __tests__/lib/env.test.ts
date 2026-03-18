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
    };
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
    expect(env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).toBe('maps-api-key');
  });

  it('includes optional fields when provided', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      NEXT_PUBLIC_SITE_URL: 'https://mysite.com',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      REGISTRATION_SECRET: 'a-long-enough-secret',
      RESEND_API_KEY: 'resend-key',
      RESEND_FROM_EMAIL: 'noreply@test.com',
    };
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://mysite.com');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-key');
    expect(env.REGISTRATION_SECRET).toBe('a-long-enough-secret');
    expect(env.RESEND_API_KEY).toBe('resend-key');
    expect(env.RESEND_FROM_EMAIL).toBe('noreply@test.com');
  });

  it('optional fields are undefined when not provided', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
    };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.REGISTRATION_SECRET;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    const { env } = require('@/lib/env');
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(env.REGISTRATION_SECRET).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.RESEND_FROM_EMAIL).toBeUndefined();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
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
    };
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
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
    };
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when NEXT_PUBLIC_SITE_URL is provided but not a valid URL', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      NEXT_PUBLIC_SITE_URL: 'not-a-url',
    };
    expect(() => require('@/lib/env')).toThrow();
  });

  it('throws when RESEND_FROM_EMAIL is provided but not a valid email', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-api-key',
      RESEND_FROM_EMAIL: 'not-an-email',
    };
    expect(() => require('@/lib/env')).toThrow();
  });
});
