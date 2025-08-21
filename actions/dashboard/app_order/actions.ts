"use server";

import { createClient } from '@/lib/supabase/server';
import { AppOrderSchema } from '@/schemas/app_order.schema';
import type { AppOrder } from '@/types/app_order';

export async function createAppOrder(input: AppOrder) {
  const parsed = AppOrderSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateAppOrder(id: string, input: AppOrder) {
  const parsed = AppOrderSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteAppOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('app_order').delete().eq('id', id);

  return { error };
}

export async function getAppOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').select('*').order('creation_date', { ascending: false });

  return { data, error };
}

export async function getAppOrder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').select('*').eq('id', id).single();

  return { data, error };
}