"use server";

import { createClient } from '@/lib/supabase/server';
import { OrganizationPlanLimitSchema } from '@/schemas/organization_plan_limit.schema';
import type { OrganizationPlanLimit } from '@/types/organization_plan_limit';

export async function createOrganizationPlanLimit(input: OrganizationPlanLimit) {
  const parsed = OrganizationPlanLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_plan_limits')
    .insert([parsed.data])
    .select()
    .single();

  return { data, error };
}

export async function updateOrganizationPlanLimit(id: string, input: OrganizationPlanLimit) {
  const parsed = OrganizationPlanLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_plan_limits')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteOrganizationPlanLimit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organization_plan_limits')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getOrganizationPlanLimits() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_plan_limits')
    .select('*, organization:organization_id(name)')
    .order('organization_id')
    .order('feature');

  return { data, error };
}

export async function getOrganizationPlanLimit(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_plan_limits')
    .select('*, organization:organization_id(name)')
    .eq('id', id)
    .single();

  return { data, error };
}
