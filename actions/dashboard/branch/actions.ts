"use server";

import { createClient } from '@/lib/supabase/server';
import { BranchSchema } from '@/schemas/branch.schema';
import type { Branch } from '@/types/branch';

export async function createBranch(input: Branch) {
  const parsed = BranchSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('branch').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateBranch(id: string, input: Branch) {
  const parsed = BranchSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('branch').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteBranch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('branch').delete().eq('id', id);

  return { error };
}
