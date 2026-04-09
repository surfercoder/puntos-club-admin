/**
 * @jest-environment node
 */
import { readLocaleCookie } from '@/app/read-locale-cookie';
import { defaultLocale } from '@/i18n/locales';

describe('readLocaleCookie (SSR / node environment)', () => {
  it('returns the default locale when document is undefined', () => {
    expect(typeof document).toBe('undefined');
    expect(readLocaleCookie()).toBe(defaultLocale);
  });
});
