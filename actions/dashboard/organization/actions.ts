"use server";

import { createClient } from '@/lib/supabase/server';
import { OrganizationSchema } from '@/schemas/organization.schema';
import type { Organization } from '@/types/organization';

export async function createOrganization(input: Organization) {
  const parsed = OrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').insert([parsed.data]).select().single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create organization');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    await supabase.from('organization').delete().eq('id', data.id);
    throw new Error('Not authenticated');
  }

  const { data: appUserRow, error: appUserError } = await supabase
    .from('app_user')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (appUserError || !appUserRow?.id) {
    await supabase.from('organization').delete().eq('id', data.id);
    throw new Error('Could not resolve app user for current session');
  }

  const appUserId = Number(appUserRow.id);
  const orgId = Number((data as { id: unknown }).id);

  const { error: membershipError } = await supabase
    .from('app_user_organization')
    .insert({
      app_user_id: appUserId,
      organization_id: orgId,
      is_active: true,
    });

  if (membershipError) {
    await supabase.from('organization').delete().eq('id', data.id);
    throw new Error(membershipError.message || 'Failed to associate user to organization');
  }

  return { data, error: null };
}

export async function updateOrganization(id: string, input: Organization) {
  const parsed = OrganizationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').update(parsed.data).eq('id', id).select().single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update organization');
  }

  return { data, error: null };
}

export async function deleteOrganization(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('organization').delete().eq('id', id);

  return { error };
}

export async function getOrganizations() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').select('*').order('name');

  return { data, error };
}

export async function getOrganization(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('organization').select('*').eq('id', id).single();

  return { data, error };
}

export async function getOrganizationProducts(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product')
    .select(`
      *,
      category:category_id(id, name),
      stock:stock(
        id,
        branch_id,
        quantity,
        branch:branch(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('required_points', { ascending: true });

  return { data, error };
}
