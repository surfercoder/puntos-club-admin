import { cn } from '@/lib/utils';

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
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    };
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeTruthy();
  });

  it('is falsy when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeFalsy();
  });

  it('is falsy when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    };
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    jest.resetModules();
    const { hasEnvVars } = require('@/lib/utils');
    expect(hasEnvVars).toBeFalsy();
  });
});
