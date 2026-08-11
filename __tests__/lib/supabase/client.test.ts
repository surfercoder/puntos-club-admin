jest.mock('@supabase/ssr', () => ({ createBrowserClient: jest.fn(() => 'browser-client') }));
jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
  },
}));

import { createBrowserClient } from '@supabase/ssr';

// jest.setup.js mocks this module for every other suite; here we want the real one.
const { createClient } = jest.requireActual('@/lib/supabase/client');

describe('lib/supabase/client', () => {
  it('builds a browser client from the public env vars', () => {
    expect(createClient()).toBe('browser-client');
    expect(createBrowserClient).toHaveBeenCalledWith('https://test.supabase.co', 'publishable-key');
  });
});
