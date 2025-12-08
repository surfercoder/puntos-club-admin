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

  // Find the user in app_user table by email
  // Note: In production, you should link auth.users.id to app_user.user_id (UUID)
  // For now, we're using email as the link
  const { data: appUser, error: userError } = await supabase
    .from('app_user')
    .select(`
      *,
      role:user_role(id, name, display_name, description),
      organization:organization(id, name, active)
    `)
    .eq('email', authData.user.email)
    .single();

  if (userError || !appUser) {
    return null;
  }

  return appUser as AppUserWithRelations;
}
