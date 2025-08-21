"use server";

import { createClient } from '@/lib/supabase/server';
import { StatusSchema } from '@/schemas/status.schema';
import type { Status } from '@/types/status';

export async function createStatus(input: Status) {
  const parsed = StatusSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('status').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateStatus(id: string, input: Status) {
  const parsed = StatusSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('status').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteStatus(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('status').delete().eq('id', id);

  return { error };
}

export async function getStatuses() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('status').select('*').order('order_num');

  return { data, error };
}

export async function getStatus(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('status').select('*').eq('id', id).single();

  return { data, error };
}
