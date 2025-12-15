"use server";

import { createClient } from '@/lib/supabase/server';
import type { AppUserWithRelations } from '@/types/app_user';

/**
 * Get the current authenticated user with their role and organization
 * Returns null if not authenticated or user not found in app_user table
 */
export async function getCurrentUser(): Promise<AppUserWithRelations | null> {
  const supabase = await createClient();

  // Get the authenticated user from Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authData?.user) {
    return null;
  }

  // Prefer linking auth.users.id -> app_user.auth_user_id.
  // Fallback to email for legacy rows and backfill auth_user_id when found.
  const select = `
    *,
    role:user_role(id, name, display_name, description),
    organization:organization(id, name)
  `

  const { data: userByAuthId } = await supabase
    .from('app_user')
    .select(select)
    .eq('auth_user_id', authData.user.id)
    .single();

  if (userByAuthId) {
    return userByAuthId as AppUserWithRelations;
  }

  const email = authData.user.email;
  if (!email) {
    return null;
  }

  const { data: userByEmail } = await supabase
    .from('app_user')
    .select(select)
    .eq('email', email)
    .single();

  if (!userByEmail) {
    return null;
  }

  // Best-effort backfill for future lookups.
  await supabase
    .from('app_user')
    .update({ auth_user_id: authData.user.id })
    .eq('id', userByEmail.id);

  return userByEmail as AppUserWithRelations;
}
