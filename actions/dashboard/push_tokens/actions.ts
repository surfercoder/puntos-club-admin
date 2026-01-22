"use server";

import { createClient } from '@/lib/supabase/server';
import { PushTokenSchema } from '@/schemas/push_token.schema';
import type { PushToken } from '@/types/push_token';

export async function createPushToken(input: PushToken) {
  const parsed = PushTokenSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_tokens').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updatePushToken(id: string, input: PushToken) {
  const parsed = PushTokenSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_tokens').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deletePushToken(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('push_tokens').delete().eq('id', id);

  return { error };
}
