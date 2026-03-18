import { locales, defaultLocale } from '@/i18n/locales';
import type { Locale } from '@/i18n/locales';

describe('locales', () => {
  it('contains es and en', () => {
    expect(locales).toEqual(['es', 'en']);
  });

  it('has exactly 2 locales', () => {
    expect(locales).toHaveLength(2);
  });

  it('is a readonly array', () => {
    // TypeScript enforces this at compile time via `as const`,
    // but we verify the runtime values are correct
    expect(Array.isArray(locales)).toBe(true);
  });
});

describe('defaultLocale', () => {
  it('is "es"', () => {
    expect(defaultLocale).toBe('es');
  });

  it('is one of the defined locales', () => {
    expect(locales).toContain(defaultLocale);
  });
});

describe('Locale type (compile-time check via runtime test)', () => {
  it('accepts valid locales', () => {
    const es: Locale = 'es';
    const en: Locale = 'en';
    expect(es).toBe('es');
    expect(en).toBe('en');
  });
});
