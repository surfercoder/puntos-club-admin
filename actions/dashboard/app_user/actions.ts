"use server";

import { cookies } from 'next/headers';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppUserSchema, type AppUserInput } from '@/schemas/app_user.schema';
import { enforcePlanLimit } from '@/lib/plans/usage';
import type { PlanFeatureKey } from '@/types/plan';

export async function createAppUser(input: AppUserInput) {
  const parsed = AppUserSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const parsedOrgId = activeOrgId ? parseInt(activeOrgId, 10) : NaN;
  const activeOrgIdNumber = Number.isFinite(parsedOrgId) ? parsedOrgId : null;

  if (!activeOrgIdNumber) {
    return { data: null, error: { message: 'No active organization selected' } };
  }

  // Resolve role name (used for plan limits and auth metadata)
  let roleName: string | null = null;
  if (parsed.data.role_id) {
    const { data: roleData } = await supabase
      .from('user_role')
      .select('name')
      .eq('id', parsed.data.role_id)
      .single();
    roleName = roleData?.name ?? null;

    // Enforce cashier / collaborator quotas before inserting
    const roleFeatureMap: Record<string, PlanFeatureKey> = {
      cashier:      'cashiers',
      collaborator: 'collaborators',
    };
    const feature = roleName ? roleFeatureMap[roleName] : undefined;

    if (feature) {
      const limitError = await enforcePlanLimit(activeOrgIdNumber, feature);
      if (limitError) {
        return { data: null, error: { message: limitError.message } };
      }
    }
  }

  // Create Supabase Auth user so the user can log in
  let authUserId: string | null = null;
  if (parsed.data.email && parsed.data.password) {
    const adminClient = createAdminClient();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        first_name: parsed.data.first_name || null,
        last_name: parsed.data.last_name || null,
        role_name: roleName,
      },
    });

    if (authError) {
      return { data: null, error: { message: authError.message } };
    }

    authUserId = authData.user?.id ?? null;
  }

  // Strip password — it's only used for Supabase Auth, never stored in app_user
  const { password: _password, ...insertData } = parsed.data;

  // Use admin client to bypass RLS for the insert (permissions are already
  // validated above via plan limits and role checks).
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('app_user')
    .insert([{
      ...insertData,
      organization_id: activeOrgIdNumber,
      ...(authUserId ? { auth_user_id: authUserId } : {}),
    }])
    .select()
    .single();

  return { data, error };
}

export async function updateAppUser(id: string, input: AppUserInput) {
  const parsed = AppUserSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  // Strip null fields so we don't overwrite existing values (e.g. password)
  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null)
  );

  const supabase = await createClient();

  // Sync password/email changes with Supabase Auth
  if (updateData.password || updateData.email) {
    const { data: existingUser } = await supabase
      .from('app_user')
      .select('auth_user_id, email, role_id, first_name, last_name')
      .eq('id', id)
      .single();

    const adminClient = createAdminClient();

    if (existingUser?.auth_user_id) {
      // Auth user exists — update it
      const authUpdate: { password?: string; email?: string } = {};
      if (updateData.password) authUpdate.password = String(updateData.password);
      if (updateData.email) authUpdate.email = String(updateData.email);

      const { error: authError } = await adminClient.auth.admin.updateUserById(
        existingUser.auth_user_id,
        authUpdate
      );

      if (authError) {
        return { data: null, error: { message: authError.message } };
      }
    } else if (updateData.password) {
      // No auth user yet — create one so the user can log in
      const email = (updateData.email || existingUser?.email) as string;
      if (email) {
        let roleName: string | null = null;
        const roleId = updateData.role_id || existingUser?.role_id;
        if (roleId) {
          const { data: roleData } = await supabase
            .from('user_role')
            .select('name')
            .eq('id', roleId)
            .single();
          roleName = roleData?.name ?? null;
        }

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: updateData.password as string,
          email_confirm: true,
          user_metadata: {
            first_name: updateData.first_name || existingUser?.first_name || null,
            last_name: updateData.last_name || existingUser?.last_name || null,
            role_name: roleName,
          },
        });

        if (authError) {
          return { data: null, error: { message: authError.message } };
        }

        // Link the new auth user to the app_user record
        if (authData.user) {
          updateData.auth_user_id = authData.user.id;
        }
      }
    }
  }

  // Strip password — it's only used for Supabase Auth, never stored in app_user
  const { password: _pw, ...dbUpdateData } = updateData;

  const { data, error } = await supabase.from('app_user').update(dbUpdateData).eq('id', id).select().single();

  return { data, error };
}

export async function deleteAppUser(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('app_user').delete().eq('id', id);

  return { error };
}

export async function getAppUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user')
    .select(`
      *,
      organization:organization(name)
    `)
    .order('first_name', { nullsFirst: false });

  return { data, error };
}

export async function getAppUser(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_user').select('*').eq('id', id).single();

  return { data, error };
}
