"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import { PlanLimitSchema } from '@/schemas/plan_limit.schema';

export async function createPlanLimit(input: Record<string, unknown>) {
  const parsed = PlanLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .insert([parsed.data])
    .select()
    .single();

  return { data, error };
}

export async function updatePlanLimit(id: string, input: Record<string, unknown>) {
  const parsed = PlanLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });
    return { error: { fieldErrors } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deletePlanLimit(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('plan_limits')
    .delete()
    .eq('id', id);

  return { error };
}

export async function getPlanLimits() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .order('plan')
    .order('feature');

  return { data, error };
}

export async function getPlanLimit(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}
