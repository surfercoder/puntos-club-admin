let mockHasEnvVars = true;

jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn() }));
jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  },
}));
jest.mock('@/lib/utils', () => ({
  get hasEnvVars() {
    return mockHasEnvVars;
  },
}));

// jest.setup.js's next/server mock has no NextResponse.next(); this suite needs it.
jest.mock('next/server', () => {
  // El cookie jar del mock guarda de verdad, así que se puede verificar que un
  // redirect arrastre las cookies que refrescó supabase.auth.getUser().
  const make = (kind: string) => {
    const jar: { name: string; value: string }[] = [];
    return {
      kind,
      cookies: {
        set: jest.fn((name: string, value: string, options?: Record<string, unknown>) => {
          jar.push({ name, value, ...(options ?? {}) });
        }),
        getAll: jest.fn(() => jar),
      },
    };
  };
  return {
    NextResponse: {
      next: jest.fn(() => make('next')),
      redirect: jest.fn((url: { pathname: string }) => make(`redirect:${url.pathname}`)),
    },
  };
});

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};

const buildRequest = (pathname: string) =>
  ({
    nextUrl: { pathname, clone: jest.fn(() => ({ pathname })) },
    cookies: { getAll: jest.fn(() => [{ name: 'sb', value: 'token' }]), set: jest.fn() },
  }) as unknown as NextRequest;

const mockUser = (user: { id: string } | null) => {
  (createServerClient as jest.Mock).mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });
};

/** The cookie adapter updateSession() handed to @supabase/ssr on its last call. */
const lastCookieAdapter = (): CookieAdapter =>
  (createServerClient as jest.Mock).mock.calls.at(-1)[2].cookies;

describe('lib/supabase/middleware updateSession', () => {
  beforeEach(() => {
    mockHasEnvVars = true;
    mockUser({ id: 'user-1' });
  });

  it('skips the auth round-trip entirely when env vars are missing', async () => {
    mockHasEnvVars = false;
    const result = await updateSession(buildRequest('/dashboard'));

    expect(result).toEqual(expect.objectContaining({ kind: 'next' }));
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it('redirects an anonymous visitor on a protected path to the login page', async () => {
    mockUser(null);
    const result = await updateSession(buildRequest('/dashboard/purchase'));
    expect(result).toEqual(expect.objectContaining({ kind: 'redirect:/auth/login' }));
  });

  // Una sesión válida no tiene nada que hacer en el login: se la manda al
  // dashboard (para entrar con otra cuenta hay que desloguearse primero).
  it('redirects an authenticated user away from the login page', async () => {
    const result = await updateSession(buildRequest('/auth/login'));
    expect(result).toEqual(expect.objectContaining({ kind: 'redirect:/dashboard' }));
  });

  // Si getUser() refrescó la sesión, esas cookies viven en la respuesta base:
  // un redirect que no las copie deja al usuario deslogueado.
  it('carries refreshed session cookies onto the redirect', async () => {
    const request = buildRequest('/auth/login');
    (createServerClient as jest.Mock).mockImplementation((_url, _key, opts) => ({
      auth: {
        getUser: jest.fn(async () => {
          opts.cookies.setAll([{ name: 'sb', value: 'fresh', options: { path: '/' } }]);
          return { data: { user: { id: 'user-1' } } };
        }),
      },
    }));

    const result = (await updateSession(request)) as unknown as {
      cookies: { set: jest.Mock };
    };
    expect(result.cookies.set).toHaveBeenCalledWith('sb', 'fresh', { path: '/' });
  });

  it('leaves an anonymous visitor on the login page', async () => {
    mockUser(null);
    const result = await updateSession(buildRequest('/auth/login'));
    expect(result).toEqual(expect.objectContaining({ kind: 'next' }));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('lets an authenticated user through', async () => {
    const result = await updateSession(buildRequest('/dashboard/purchase'));
    expect(result).toEqual(expect.objectContaining({ kind: 'next' }));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/beneficiaries'],
    ['/'],
    ['/login'],
    ['/auth/callback'],
    ['/owner/onboarding'],
    ['/mobile-apps'],
  ])('leaves an anonymous visitor alone on the public path %s', async (pathname) => {
    mockUser(null);
    const result = await updateSession(buildRequest(pathname));
    expect(result).toEqual(expect.objectContaining({ kind: 'next' }));
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('reads request cookies through the adapter', async () => {
    await updateSession(buildRequest('/dashboard'));
    expect(lastCookieAdapter().getAll()).toEqual([{ name: 'sb', value: 'token' }]);
  });

  it('mirrors refreshed cookies onto both the request and the outgoing response', async () => {
    const request = buildRequest('/dashboard');
    await updateSession(request);
    const adapter = lastCookieAdapter();

    (NextResponse.next as jest.Mock).mockClear();
    adapter.setAll([{ name: 'sb', value: 'fresh', options: { path: '/' } }]);

    expect(request.cookies.set).toHaveBeenCalledWith('sb', 'fresh');
    // a fresh response is rebuilt so the new cookies survive
    expect(NextResponse.next).toHaveBeenCalledWith({ request });
    const rebuilt = (NextResponse.next as jest.Mock).mock.results[0].value;
    expect(rebuilt.cookies.set).toHaveBeenCalledWith('sb', 'fresh', { path: '/' });
  });
});
