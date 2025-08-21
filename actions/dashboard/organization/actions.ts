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

  return { data, error };
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

  return { data, error };
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
