import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Creates a Supabase admin client with service role privileges
 * This client bypasses RLS and can perform admin operations like creating auth users
 * IMPORTANT: Only use this on the server side, never expose to the client
 */
export function createAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env.local file.\n' +
      'You can find it in your Supabase project settings under API > service_role key.'
    );
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
