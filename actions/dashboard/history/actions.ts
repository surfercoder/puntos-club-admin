"use server";

import { createClient } from '@/lib/supabase/server';
import { HistorySchema } from '@/schemas/history.schema';
import type { History } from '@/types/history';

export async function createHistory(input: History) {
  const parsed = HistorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('history').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateHistory(id: string, input: History) {
  const parsed = HistorySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('history').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteHistory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('history').delete().eq('id', id);

  return { error };
}

export async function getHistories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('history')
    .select(`
      *,
      app_order:app_order(order_number),
      status:status(name)
    `)
    .order('change_date', { ascending: false });

  return { data, error };
}

export async function getHistory(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('history').select('*').eq('id', id).single();

  return { data, error };
}