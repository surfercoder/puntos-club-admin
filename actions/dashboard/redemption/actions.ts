"use server";

import { createClient } from '@/lib/supabase/server';
import { RedemptionSchema } from '@/schemas/redemption.schema';
import type { Redemption } from '@/types/redemption';

export async function createRedemption(input: Redemption) {
  const parsed = RedemptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateRedemption(id: string, input: Redemption) {
  const parsed = RedemptionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteRedemption(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('redemption').delete().eq('id', id);

  return { error };
}

export async function getRedemptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(first_name, last_name, email),
      product:product(name),
      app_order:app_order(order_number)
    `)
    .order('redemption_date', { ascending: false });

  return { data, error };
}

export async function getRedemption(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('redemption').select('*').eq('id', id).single();

  return { data, error };
}