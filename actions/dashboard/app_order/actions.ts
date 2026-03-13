"use server";

import { createClient } from '@/lib/supabase/server';
import type { AppOrder } from '@/types/app_order';

export async function createAppOrder(input: AppOrder) {
  const { id: _id, ...insertData } = input;

  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').insert([insertData]).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return { data };
}

export async function updateAppOrder(id: string, input: AppOrder) {
  const { id: _id, ...updateData } = input;

  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').update(updateData).eq('id', id).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return { data };
}

export async function deleteAppOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('app_order').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
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