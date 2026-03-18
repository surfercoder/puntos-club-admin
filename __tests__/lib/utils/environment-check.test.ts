const PRODUCTION_PROJECT_ID = 'yggtzkwoxikrcwoniibh';
const TEST_PROJECT_ID = 'hcydeiclitorrqpwrtxb';

describe('getEnvironmentInfo', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function loadModule() {
    return require('@/lib/utils/environment-check');
  }

  it('detects PRODUCTION environment', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_PROJECT_ID}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'some-key-here-1234567890',
      NEXT_PUBLIC_SITE_URL: 'https://production.example.com',
    };
    const { getEnvironmentInfo } = loadModule();
    const info = getEnvironmentInfo();
    expect(info.environment).toBe('PRODUCTION');
    expect(info.isProduction).toBe(true);
    expect(info.isTest).toBe(false);
    expect(info.projectId).toBe(PRODUCTION_PROJECT_ID);
    expect(info.supabaseUrl).toBe(`https://${PRODUCTION_PROJECT_ID}.supabase.co`);
    expect(info.siteUrl).toBe('https://production.example.com');
    expect(info.keyPreview).toBe('some-key-here-123456...');
  });

  it('detects TEST environment', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_PROJECT_ID}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key-abcdefghij12',
      NEXT_PUBLIC_SITE_URL: 'https://test.example.com',
    };
    const { getEnvironmentInfo } = loadModule();
    const info = getEnvironmentInfo();
    expect(info.environment).toBe('TEST');
    expect(info.isProduction).toBe(false);
    expect(info.isTest).toBe(true);
    expect(info.projectId).toBe(TEST_PROJECT_ID);
  });

  it('returns UNKNOWN for unrecognized project ID', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://unknownproject.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'some-key-abcdefghij12',
    };
    const { getEnvironmentInfo } = loadModule();
    const info = getEnvironmentInfo();
    expect(info.environment).toBe('UNKNOWN');
    expect(info.isProduction).toBe(false);
    expect(info.isTest).toBe(false);
    expect(info.projectId).toBe('unknownproject');
  });

  it('handles missing env vars', () => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { getEnvironmentInfo } = loadModule();
    const info = getEnvironmentInfo();
    expect(info.environment).toBe('UNKNOWN');
    expect(info.isProduction).toBe(false);
    expect(info.isTest).toBe(false);
    expect(info.projectId).toBeUndefined();
    expect(info.supabaseUrl).toBeUndefined();
    expect(info.siteUrl).toBeUndefined();
    expect(info.keyPreview).toBe('Not set');
  });

  it('handles URL that does not match supabase pattern', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-key-abcdef1234',
    };
    const { getEnvironmentInfo } = loadModule();
    const info = getEnvironmentInfo();
    expect(info.projectId).toBeUndefined();
    expect(info.environment).toBe('UNKNOWN');
  });
});

describe('logEnvironmentInfo', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns the same result as getEnvironmentInfo', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_PROJECT_ID}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'some-key-abcdefghij12',
    };
    const { getEnvironmentInfo, logEnvironmentInfo } = require('@/lib/utils/environment-check');
    const envInfo = getEnvironmentInfo();
    const logInfo = logEnvironmentInfo();
    expect(logInfo).toEqual(envInfo);
  });
});
