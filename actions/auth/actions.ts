'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Check if the currently authenticated user is allowed to access the admin portal
 * Returns the user's role if allowed, or null if not allowed
 */
export async function checkAdminPortalAccess(): Promise<{
  allowed: boolean;
  role: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { allowed: false, role: null, error: 'No authenticated user' };
  }

  // Try to find the app_user by auth_user_id first
  let appUser = null;

  const { data: userByAuthId } = await supabase
    .from('app_user')
    .select('id, auth_user_id, email, role:role_id(name)')
    .eq('auth_user_id', user.id)
    .single();

  if (userByAuthId) {
    appUser = userByAuthId;
  } else if (user.email) {
    // Fallback: try to find by email (for users created before auth_user_id was added)
    const { data: userByEmail } = await supabase
      .from('app_user')
      .select('id, auth_user_id, email, role:role_id(name)')
      .eq('email', user.email)
      .single();

    if (userByEmail) {
      appUser = userByEmail;
      // Update the auth_user_id for future lookups
      await supabase
        .from('app_user')
        .update({ auth_user_id: user.id })
        .eq('id', userByEmail.id);
    }
  }

  if (!appUser) {
    return { allowed: false, role: null, error: 'User not found in app_user table' };
  }

  const role = appUser.role as unknown as { name: string } | null;
  const roleName = role?.name;
  const allowedRoles = ['admin', 'owner', 'collaborator'];

  if (!roleName || !allowedRoles.includes(roleName)) {
    // Sign out the unauthorized user
    await supabase.auth.signOut();
    return {
      allowed: false,
      role: roleName || null,
      error: 'No tienes permisos para acceder al portal de administración. Solo administradores, propietarios y colaboradores pueden acceder.'
    };
  }

  return { allowed: true, role: roleName, error: null };
}

/**
 * Sign up a new admin user (owner) with their organization
 * Creates: 1) Supabase Auth user, 2) Organization, 3) app_user record with owner role
 */
export async function signUpOwner(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}): Promise<{ success: boolean; error: string | null }> {
  const adminClient = createAdminClient();

  try {
    // 1. Create the Supabase Auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm for immediate login
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create auth user' };
    }

    // 2. Get the owner role ID
    const { data: roleData, error: roleError } = await adminClient
      .from('user_role')
      .select('id')
      .eq('name', 'owner')
      .single();

    if (roleError || !roleData) {
      // Cleanup: delete the auth user if we can't proceed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to get owner role' };
    }

    // 3. Create the organization
    const orgName = data.organizationName || `${data.email}'s Organization`;
    const { data: orgData, error: orgError } = await adminClient
      .from('organization')
      .insert({ name: orgName })
      .select('id')
      .single();

    if (orgError || !orgData) {
      // Cleanup: delete the auth user if we can't proceed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: 'Failed to create organization' };
    }

    // 4. Create the app_user record linked to auth user and organization
    const { error: appUserError } = await adminClient
      .from('app_user')
      .insert({
        email: data.email,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        organization_id: orgData.id,
        role_id: roleData.id,
        auth_user_id: authData.user.id,
        active: true,
      });

    if (appUserError) {
      // Cleanup: delete auth user and organization
      await adminClient.auth.admin.deleteUser(authData.user.id);
      await adminClient.from('organization').delete().eq('id', orgData.id);
      return { success: false, error: 'Failed to create user profile' };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
