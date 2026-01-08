'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@/types/user';

/**
 * Create a new user (either app_user or beneficiary based on role)
 */
export async function createUser(user: Partial<User>) {
  
  const supabase = await createClient();
  
  // Determine which table to insert into based on user_type
  const table = user.user_type === 'beneficiary' ? 'beneficiary' : 'app_user';
  
  // For app_user types (owner, collaborator, cashier, admin), create a Supabase Auth user first
  let authUserId: string | null = null;
  
  if (table === 'app_user' && user.email && user.password) {
    try {
      const adminClient = createAdminClient();
      
      
      // Create the auth user with admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email so they can log in immediately
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          role_name: 'staff', // Mark as staff user to prevent automatic beneficiary creation
        },
      });
      
      if (authError) {
        console.error('Failed to create auth user:', authError);
        throw new Error(`Failed to create authentication user: ${authError.message}`);
      }
      
      if (!authData.user) {
        throw new Error('Auth user creation succeeded but no user data returned');
      }
      
      authUserId = authData.user.id;
      
    } catch (error) {
      console.error('Error creating auth user:', error);
      throw error;
    }
  }
  
  // Prepare base data common to both tables
  const userData: Record<string, unknown> = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    active: user.active ?? true,
    role_id: user.role_id,
  };
  
  // Add app_user-specific fields
  if (table === 'app_user') {
    userData.organization_id = user.organization_id;
    userData.username = user.username;
    userData.auth_user_id = authUserId; // Link to the auth user
    // Note: created_by is set to null because we don't have a direct mapping
    // between auth.users (UUID) and app_user.id (BIGINT)
    userData.created_by = null;
    if (user.password) {
      userData.password = user.password;
    }
  }
  
  // Add beneficiary-specific fields
  if (table === 'beneficiary') {
    userData.phone = user.phone;
    userData.document_id = user.document_id;
    userData.available_points = 0;
    userData.registration_date = new Date().toISOString();
  }
  
  // For app_user types with organization, use the atomic stored procedure
  if (table === 'app_user' && user.organization_id) {
    const { data, error } = await supabase.rpc('create_app_user_with_org', {
      p_email: userData.email as string,
      p_first_name: userData.first_name as string,
      p_last_name: userData.last_name as string,
      p_username: (userData.username as string) || null,
      p_organization_id: userData.organization_id as number,
      p_role_id: userData.role_id as number,
      p_auth_user_id: authUserId,
      p_password: (userData.password as string) || null,
      p_active: userData.active as boolean,
    });

    if (error) {
      console.error('Database RPC error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      // If RPC fails but auth user was created, clean up the auth user
      if (authUserId) {
        try {
          const adminClient = createAdminClient();
          await adminClient.auth.admin.deleteUser(authUserId);
        } catch (cleanupError) {
          console.error('Failed to clean up auth user:', cleanupError);
        }
      }
      
      throw new Error(`Failed to create user: ${error.message} (${error.code})`);
    }

    return data && data.length > 0 ? data[0] : null;
  }

  // For beneficiary or app_user without organization, use regular insert
  const { data, error } = await supabase
    .from(table)
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('Database insert error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    
    // If database insert fails but auth user was created, clean up the auth user
    if (authUserId) {
      try {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.deleteUser(authUserId);
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError);
      }
    }
    
    throw new Error(`Failed to create user: ${error.message} (${error.code})`);
  }

  return data;
}

/**
 * Update an existing user
 */
export async function updateUser(id: string, user: Partial<User>) {
  const supabase = await createClient();
  
  // Determine which table to update based on user_type
  const table = user.user_type === 'beneficiary' ? 'beneficiary' : 'app_user';
  
  // If updating an app_user with a password, update the auth user as well
  if (table === 'app_user' && user.password) {
    try {
      // First, get the auth_user_id for this app_user
      const { data: existingUser, error: fetchError } = await supabase
        .from('app_user')
        .select('auth_user_id, email')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch existing user:', fetchError);
        throw new Error(`Failed to fetch existing user: ${fetchError.message}`);
      }
      
      // Update the auth user's password if they have an auth_user_id
      if (existingUser.auth_user_id) {
        const adminClient = createAdminClient();

        const { error: authError } = await adminClient.auth.admin.updateUserById(
          existingUser.auth_user_id,
          { password: user.password }
        );

        if (authError) {
          console.error('Failed to update auth user password:', authError);
          throw new Error(`Failed to update authentication password: ${authError.message}`);
        }
      }
    } catch (error) {
      console.error('Error updating auth user:', error);
      throw error;
    }
  }

  // Prepare base data common to both tables
  const userData: Record<string, unknown> = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    active: user.active,
    role_id: user.role_id,
  };
  
  // Add app_user-specific fields
  if (table === 'app_user') {
    userData.organization_id = user.organization_id;
    userData.username = user.username;
    if (user.password) {
      userData.password = user.password;
    }
  }
  
  // Add beneficiary-specific fields
  if (table === 'beneficiary') {
    userData.phone = user.phone;
    userData.document_id = user.document_id;
  }

  const { data, error } = await supabase
    .from(table)
    .update(userData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string, userType: 'app_user' | 'beneficiary') {
  const supabase = await createClient();
  
  const table = userType === 'beneficiary' ? 'beneficiary' : 'app_user';
  
  // If deleting an app_user, also delete the auth user
  if (table === 'app_user') {
    try {
      // First, get the auth_user_id for this app_user
      const { data: existingUser, error: fetchError } = await supabase
        .from('app_user')
        .select('auth_user_id, email')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch existing user:', fetchError);
        throw new Error(`Failed to fetch existing user: ${fetchError.message}`);
      }
      
      // Delete the auth user if they have an auth_user_id
      if (existingUser.auth_user_id) {
        const adminClient = createAdminClient();

        const { error: authError } = await adminClient.auth.admin.deleteUser(
          existingUser.auth_user_id
        );

        if (authError) {
          console.error('Failed to delete auth user:', authError);
          // Don't throw here - continue with database deletion
          // The CASCADE constraint will handle cleanup
        }
      }
    } catch (error) {
      console.error('Error deleting auth user:', error);
      // Don't throw - continue with database deletion
    }
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }

  return { success: true };
}

/**
 * Get all users (both app_user and beneficiary)
 * For admins: returns all users including owners
 * For owners: returns only cashiers and collaborators from their organization (excluding other owners)
 */
export async function getAllUsers(organizationId?: string) {
  const supabase = await createClient();

  // Build query for app_users
  let appUsersQuery = supabase
    .from('app_user')
    .select(`
      *,
      organization:organization_id(id, name),
      role:role_id(id, name, display_name)
    `);

  // Filter by organization if provided (for owners)
  if (organizationId) {
    appUsersQuery = appUsersQuery.eq('organization_id', organizationId);
  }

  const { data: appUsers, error: appUsersError } = await appUsersQuery
    .order('created_at', { ascending: false });

  if (appUsersError) {
    console.error('Failed to fetch app users:', appUsersError);
    throw new Error(`Failed to fetch app users: ${appUsersError.message}`);
  }
  
  // Filter out owner users only when organizationId is provided (i.e., when called by an owner user)
  // Admins (no organizationId) should see all users including owners
  const filteredAppUsers = (appUsers || []).filter(u => {
    const role = u.role as { id: number; name: string; display_name: string } | null;
    // If organizationId is provided (owner viewing their org), exclude other owners
    // If no organizationId (admin viewing all), include everyone
    return !organizationId || role?.name !== 'owner';
  });
  
  // Fetch beneficiaries (they don't have organization_id directly)
  // For now, we'll only show beneficiaries to admins
  let beneficiaries: Array<{ id: number; name: string; email: string; role: { id: number; name: string; display_name: string } | null }> = [];
  if (!organizationId) {
    const { data: beneficiariesData, error: beneficiariesError } = await supabase
      .from('beneficiary')
      .select(`
        *,
        role:role_id(id, name, display_name)
      `)
      .order('created_at', { ascending: false });
    
    if (beneficiariesError) {
      console.error('Failed to fetch beneficiaries:', beneficiariesError);
    } else {
      beneficiaries = beneficiariesData || [];
    }
  }
  
  // Combine and add user_type
  const allUsers = [
    ...filteredAppUsers.map(u => ({ ...u, user_type: 'app_user' as const })),
    ...beneficiaries.map(b => ({ ...b, user_type: 'beneficiary' as const })),
  ];
  
  // Sort by created_at
  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return allUsers;
}

/**
 * Get a single user by ID and type
 */
export async function getUserById(id: string, userType: 'app_user' | 'beneficiary') {
  const supabase = await createClient();
  
  const table = userType === 'beneficiary' ? 'beneficiary' : 'app_user';
  
  const { data, error } = await supabase
    .from(table)
    .select(`
      *,
      organization:organization_id(id, name),
      role:role_id(id, name, display_name)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
  
  return { ...data, user_type: userType };
}
