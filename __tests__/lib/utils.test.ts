import {
  POINT_RANGES,
  cn,
  isNavItemActive,
  parseDashboardRange,
  parsePage,
  parsePerPage,
  previewPoints,
  formatDateTime,
  formatDateOnly,
} from '@/lib/utils';

describe('cn', () => {
  it('merges simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const showHidden = false;
    const showClass = true;
    expect(cn('base', showHidden && 'hidden', 'visible')).toBe('base visible');
    expect(cn('base', showClass && 'hidden', 'visible')).toBe('base hidden visible');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('hasEnvVars', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('is truthy when both env vars are set', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-key',
    };
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeTruthy();
  });

  it('is falsy when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeFalsy();
  });

  it('is falsy when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    };
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeFalsy();
  });
});

describe('formatDateTime', () => {
  it('formats with no locale or options (system default)', () => {
    const out = formatDateTime('2026-05-06T12:34:56Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('formats with explicit locale and options', () => {
    const out = formatDateTime('2026-05-06T12:34:56Z', 'en-US', { timeZone: 'UTC', year: 'numeric' });
    expect(out).toMatch(/2026/);
  });
});

describe('formatDateOnly', () => {
  it('formats date with no locale or options', () => {
    const out = formatDateOnly('2026-05-06T12:34:56Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('formats date with explicit locale and options', () => {
    const out = formatDateOnly('2026-05-06T12:34:56Z', 'es-AR', { timeZone: 'UTC' });
    expect(out).toMatch(/2026/);
  });
});

describe('isNavItemActive', () => {
  it('returns false without a pathname', () => {
    expect(isNavItemActive(null, '/dashboard/beneficiary')).toBe(false);
  });

  it('matches /dashboard only exactly', () => {
    expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavItemActive('/dashboard/beneficiary', '/dashboard')).toBe(false);
  });

  it('matches an entity route and its children', () => {
    expect(isNavItemActive('/dashboard/beneficiary', '/dashboard/beneficiary')).toBe(true);
    expect(isNavItemActive('/dashboard/beneficiary/create', '/dashboard/beneficiary')).toBe(true);
  });

  it('does not match a sibling route with the same prefix', () => {
    expect(isNavItemActive('/dashboard/beneficiary_organization', '/dashboard/beneficiary')).toBe(false);
  });
});

describe('parseDashboardRange', () => {
  it('accepts the supported ranges', () => {
    expect(parseDashboardRange('3')).toBe(3);
    expect(parseDashboardRange('12')).toBe(12);
  });

  it('falls back to 6 months for missing or unsupported values', () => {
    expect(parseDashboardRange(undefined)).toBe(6);
    expect(parseDashboardRange('99')).toBe(6);
    expect(parseDashboardRange('abc')).toBe(6);
  });
});

describe('parsePerPage', () => {
  it('accepts the offered page sizes', () => {
    expect(parsePerPage('25')).toBe(25);
    expect(parsePerPage('100')).toBe(100);
  });

  it('falls back to 10 for anything else', () => {
    expect(parsePerPage(undefined)).toBe(10);
    expect(parsePerPage('7')).toBe(10);
  });
});

describe('parsePage', () => {
  it('clamps to the available pages', () => {
    expect(parsePage('2', 5)).toBe(2);
    expect(parsePage('9', 5)).toBe(5);
  });

  it('falls back to the first page for junk or out-of-range input', () => {
    expect(parsePage(undefined, 5)).toBe(1);
    expect(parsePage('0', 5)).toBe(1);
    expect(parsePage('1.5', 5)).toBe(1);
  });

  it('treats an empty result set as a single page', () => {
    expect(parsePage('3', 0)).toBe(1);
  });
});

describe('previewPoints', () => {
  it('takes a percentage of the purchase', () => {
    expect(previewPoints('percentage', 5, 1000)).toBe(50);
  });

  it('scales fixed points per $100 spent', () => {
    expect(previewPoints('fixed_amount', 2, 250)).toBe(5);
  });

  it('returns zero for a missing or negative value', () => {
    expect(previewPoints('percentage', 0, 1000)).toBe(0);
    expect(previewPoints('percentage', -1, 1000)).toBe(0);
    expect(previewPoints('percentage', Number.NaN, 1000)).toBe(0);
  });
});

describe('POINT_RANGES', () => {
  it('covers every balance without gaps', () => {
    expect(POINT_RANGES[0].min).toBe(0);
    expect(POINT_RANGES.at(-1)!.max).toBe(Number.POSITIVE_INFINITY);
    POINT_RANGES.forEach((range, i) => {
      if (i > 0) expect(range.min).toBe(POINT_RANGES[i - 1].max);
    });
  });
});
