const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

jest.mock('next-intl/server', () => ({
  getRequestConfig: jest.fn((fn: Function) => fn),
}));

describe('i18n/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses default locale (es) when no cookie is set', async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const configFn = (await import('@/i18n/request')).default;
    const result = await configFn();

    expect(result.locale).toBe('es');
    expect(result.messages).toBeDefined();
  });

  it('uses cookie locale when valid locale is set', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'en' });

    const configFn = (await import('@/i18n/request')).default;
    const result = await configFn();

    expect(result.locale).toBe('en');
    expect(result.messages).toBeDefined();
  });

  it('falls back to default locale when invalid cookie locale is set', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'fr' });

    const configFn = (await import('@/i18n/request')).default;
    const result = await configFn();

    expect(result.locale).toBe('es');
  });

  it('exports locales and defaultLocale', async () => {
    const mod = await import('@/i18n/request');

    expect(mod.locales).toEqual(['es', 'en']);
    expect(mod.defaultLocale).toBe('es');
  });
});
