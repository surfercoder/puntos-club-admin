"use server";

import { createClient } from '@/lib/supabase/server';
import { BeneficiarySchema } from '@/schemas/beneficiary.schema';
import type { Beneficiary } from '@/types/beneficiary';

export async function createBeneficiary(input: Beneficiary) {
  const parsed = BeneficiarySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('beneficiary').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateBeneficiary(id: string, input: Beneficiary) {
  const parsed = BeneficiarySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('beneficiary').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteBeneficiary(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('beneficiary').delete().eq('id', id);

  return { error };
}
