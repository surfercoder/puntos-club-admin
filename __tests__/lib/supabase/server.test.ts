jest.mock('@supabase/ssr', () => ({ createServerClient: jest.fn(() => 'server-client') }));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  },
}));

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (toSet: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};

/** Runs createClient() and hands back the cookie adapter it passed to @supabase/ssr. */
const cookieAdapter = async (store: { getAll: jest.Mock; set: jest.Mock }): Promise<CookieAdapter> => {
  (cookies as jest.Mock).mockResolvedValue(store);
  await createClient();
  return (createServerClient as jest.Mock).mock.calls[0][2].cookies;
};

describe('lib/supabase/server', () => {
  it('builds a server client from the public env vars', async () => {
    (cookies as jest.Mock).mockResolvedValue({ getAll: jest.fn(), set: jest.fn() });
    expect(await createClient()).toBe('server-client');
    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'publishable-key',
      expect.objectContaining({ cookies: expect.anything() }),
    );
  });

  it('reads cookies through the request store', async () => {
    const store = { getAll: jest.fn(() => [{ name: 'sb', value: 'token' }]), set: jest.fn() };
    const adapter = await cookieAdapter(store);
    expect(adapter.getAll()).toEqual([{ name: 'sb', value: 'token' }]);
  });

  it('writes every cookie back to the store', async () => {
    const store = { getAll: jest.fn(), set: jest.fn() };
    const adapter = await cookieAdapter(store);
    adapter.setAll([
      { name: 'a', value: '1', options: { path: '/' } },
      { name: 'b', value: '2', options: undefined },
    ]);
    expect(store.set).toHaveBeenNthCalledWith(1, 'a', '1', { path: '/' });
    expect(store.set).toHaveBeenNthCalledWith(2, 'b', '2', undefined);
  });

  it('swallows the write error raised when called from a Server Component', async () => {
    const store = {
      getAll: jest.fn(),
      set: jest.fn(() => {
        throw new Error('Cookies can only be modified in a Server Action or Route Handler');
      }),
    };
    const adapter = await cookieAdapter(store);
    expect(() => adapter.setAll([{ name: 'a', value: '1' }])).not.toThrow();
  });
});
