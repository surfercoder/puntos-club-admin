"use server";

import { createClient } from '@/lib/supabase/server';
import { StockSchema } from '@/schemas/stock.schema';
import type { Stock } from '@/types/stock';

export async function createStock(input: Stock) {
  const parsed = StockSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('stock').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateStock(id: string, input: Stock) {
  const parsed = StockSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('stock').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteStock(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('stock').delete().eq('id', id);

  return { error };
}

export async function getStocks() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      branch:branch(name),
      product:product(name)
    `)
    .order('last_updated', { ascending: false });

  return { data, error };
}

export async function getStock(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('stock').select('*').eq('id', id).single();

  return { data, error };
}