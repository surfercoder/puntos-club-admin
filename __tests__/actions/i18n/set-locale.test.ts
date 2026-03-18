const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => mockCookieStore),
}));

import { setLocale } from '@/actions/i18n/set-locale';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('setLocale', () => {
  it('should set locale cookie for valid locale "es"', async () => {
    await setLocale('es');
    expect(mockCookieStore.set).toHaveBeenCalledWith('NEXT_LOCALE', 'es', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  });

  it('should set locale cookie for valid locale "en"', async () => {
    await setLocale('en');
    expect(mockCookieStore.set).toHaveBeenCalledWith('NEXT_LOCALE', 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  });

  it('should not set cookie for invalid locale', async () => {
    await setLocale('fr' as 'es');
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });
});
