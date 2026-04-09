/**
 * @jest-environment jsdom
 */
import { readLocaleCookie } from '@/app/read-locale-cookie';
import { defaultLocale } from '@/i18n/locales';

describe('readLocaleCookie (browser)', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  afterEach(() => {
    if (originalCookie) Object.defineProperty(Document.prototype, 'cookie', originalCookie);
  });

  it('returns supported locale when NEXT_LOCALE cookie is valid', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'NEXT_LOCALE=en; other=1',
    });
    expect(readLocaleCookie()).toBe('en');
  });

  it('falls back to default when cookie value is unsupported', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'NEXT_LOCALE=fr',
    });
    expect(readLocaleCookie()).toBe(defaultLocale);
  });

  it('falls back to default when NEXT_LOCALE cookie is absent', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'other=1',
    });
    expect(readLocaleCookie()).toBe(defaultLocale);
  });

});
