'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User } from '@/types/user';

/**
 * Create a new user (either app_user or beneficiary based on role)
 */
export async function createUser(user: Partial<User>) {
  console.log('createUser called with:', user);
  
  const supabase = await createClient();
  
  // Determine which table to insert into based on user_type
  const table = user.user_type === 'beneficiary' ? 'beneficiary' : 'app_user';
  console.log('Inserting into table:', table);
  
  // For app_user types (owner, collaborator, cashier, admin), create a Supabase Auth user first
  let authUserId: string | null = null;
  
  if (table === 'app_user' && user.email && user.password) {
    try {
      const adminClient = createAdminClient();
      
      console.log('Creating Supabase Auth user for:', user.email);
      
      // Create the auth user with admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email so they can log in immediately
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
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
      console.log('Auth user created successfully:', authUserId);
      
    } catch (error) {
      console.error('Error creating auth user:', error);
      throw error;
    }
  }
  
  // Prepare base data common to both tables
  const userData: any = {
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
  
  console.log('Attempting to insert user data:', { ...userData, password: userData.password ? '***' : undefined, auth_user_id: authUserId });
  
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
        console.log('Cleaned up auth user after database error');
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError);
      }
    }
    
    throw new Error(`Failed to create user: ${error.message} (${error.code})`);
  }

  console.log('User created successfully:', { table, userId: data?.id, data });
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
        
        console.log('Updating auth user password for:', existingUser.email);
        
        const { error: authError } = await adminClient.auth.admin.updateUserById(
          existingUser.auth_user_id,
          { password: user.password }
        );
        
        if (authError) {
          console.error('Failed to update auth user password:', authError);
          throw new Error(`Failed to update authentication password: ${authError.message}`);
        }
        
        console.log('Auth user password updated successfully');
      }
    } catch (error) {
      console.error('Error updating auth user:', error);
      throw error;
    }
  }
  
  // Prepare base data common to both tables
  const userData: any = {
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
        
        console.log('Deleting auth user for:', existingUser.email);
        
        const { error: authError } = await adminClient.auth.admin.deleteUser(
          existingUser.auth_user_id
        );
        
        if (authError) {
          console.error('Failed to delete auth user:', authError);
          // Don't throw here - continue with database deletion
          // The CASCADE constraint will handle cleanup
        } else {
          console.log('Auth user deleted successfully');
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
 */
export async function getAllUsers() {
  const supabase = await createClient();
  
  // Check auth status
  const { data: { user: authUser } } = await supabase.auth.getUser();
  console.log('getAllUsers - Auth user:', authUser?.id || 'none');
  
  // Fetch app_users
  const { data: appUsers, error: appUsersError } = await supabase
    .from('app_user')
    .select(`
      *,
      organization:organization_id(id, name),
      role:role_id(id, name, display_name)
    `)
    .order('created_at', { ascending: false });
  
  console.log('getAllUsers - Query result:', {
    count: appUsers?.length || 0,
    error: appUsersError ? {
      message: appUsersError.message,
      code: appUsersError.code,
      details: appUsersError.details
    } : null,
    sample: appUsers?.[0]
  });
  
  if (appUsersError) {
    console.error('Failed to fetch app users:', appUsersError);
    throw new Error(`Failed to fetch app users: ${appUsersError.message}`);
  }
  
  console.log('Fetched app users:', appUsers?.length || 0);
  
  // Fetch beneficiaries (they don't have organization_id directly)
  const { data: beneficiaries, error: beneficiariesError } = await supabase
    .from('beneficiary')
    .select(`
      *,
      role:role_id(id, name, display_name)
    `)
    .order('created_at', { ascending: false });
  
  if (beneficiariesError) {
    console.error('Failed to fetch beneficiaries:', beneficiariesError);
    // Don't throw, just continue with empty beneficiaries array
  }
  
  // Combine and add user_type
  const allUsers = [
    ...(appUsers || []).map(u => ({ ...u, user_type: 'app_user' as const })),
    ...(beneficiaries || []).map(b => ({ ...b, user_type: 'beneficiary' as const })),
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
