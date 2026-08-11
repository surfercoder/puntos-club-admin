jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => 'admin-client') }));

/**
 * admin.ts reads env at call time, so each case reloads it under a different env.
 * The @supabase/supabase-js mock must be re-required after the reset — the registry
 * hands out a fresh instance and the pre-reset reference stops recording calls.
 */
const loadWith = (serviceRoleKey: string | undefined) => {
  jest.resetModules();
  jest.doMock('@/lib/env', () => ({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    },
  }));
  return {
    createAdminClient: require('@/lib/supabase/admin').createAdminClient,
    createClient: require('@supabase/supabase-js').createClient as jest.Mock,
  };
};

describe('lib/supabase/admin', () => {
  it('builds a service-role client with session persistence off', () => {
    const { createAdminClient, createClient } = loadWith('service-role-key');
    expect(createAdminClient()).toBe('admin-client');
    expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'service-role-key', {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  it('throws instead of silently building an anon client when the key is missing', () => {
    const { createAdminClient, createClient } = loadWith(undefined);
    expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY is not set');
    expect(createClient).not.toHaveBeenCalled();
  });
});
