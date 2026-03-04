"use server";

import { createClient } from '@/lib/supabase/server';
import { AppUserSchema } from '@/schemas/app_user.schema';
import type { AppUser } from '@/types/app_user';
import { enforcePlanLimit } from '@/lib/plans/usage';
import type { PlanFeatureKey } from '@/types/plan';

export async function createAppUser(input: AppUser) {
  const parsed = AppUserSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();

  // Enforce cashier / collaborator quotas before inserting
  if (parsed.data.role_id && parsed.data.organization_id) {
    const { data: roleData } = await supabase
      .from('user_role')
      .select('name')
      .eq('id', parsed.data.role_id)
      .single();

    const roleFeatureMap: Record<string, PlanFeatureKey> = {
      cashier:      'cashiers',
      collaborator: 'collaborators',
    };
    const feature = roleData?.name ? roleFeatureMap[roleData.name as string] : undefined;

    if (feature) {
      const limitError = await enforcePlanLimit(Number(parsed.data.organization_id), feature);
      if (limitError) {
        return { data: null, error: { message: limitError.message } };
      }
    }
  }

  const { data, error } = await supabase.from('app_user').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateAppUser(id: string, input: AppUser) {
  const parsed = AppUserSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('app_user').update(parsed.data).eq('id', id).select().single();

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