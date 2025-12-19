"use server";

import { createClient } from '@/lib/supabase/server';
import { AppUserOrganizationSchema } from '@/schemas/app_user_organization.schema';
import type { AppUserOrganization } from '@/schemas/app_user_organization.schema';

export async function createAppUserOrganization(input: AppUserOrganization) {
  const parsed = AppUserOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user_organization')
    .insert([{
      app_user_id: parsed.data.app_user_id,
      organization_id: parsed.data.organization_id,
      is_active: parsed.data.is_active,
    }])
    .select()
    .single();

  return { data, error };
}

export async function updateAppUserOrganization(id: string, input: AppUserOrganization) {
  const parsed = AppUserOrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user_organization')
    .update({
      app_user_id: parsed.data.app_user_id,
      organization_id: parsed.data.organization_id,
      is_active: parsed.data.is_active,
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteAppUserOrganization(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('app_user_organization').delete().eq('id', id);

  return { error };
}

export async function getAppUserOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user_organization')
    .select(`
      *,
      app_user:app_user_id(id, first_name, last_name, email),
      organization:organization_id(id, name)
    `)
    .order('id', { ascending: false });

  return { data, error };
}

export async function getAppUserOrganization(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user_organization')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}
