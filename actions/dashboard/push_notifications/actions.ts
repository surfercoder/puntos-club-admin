"use server";

import { createClient } from '@/lib/supabase/server';
import { PushNotificationSchema } from '@/schemas/push_notification.schema';
import type { PushNotification } from '@/types/push_notification';

export async function createPushNotification(input: PushNotification) {
  const parsed = PushNotificationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_notifications').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updatePushNotification(id: string, input: PushNotification) {
  const parsed = PushNotificationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_notifications').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deletePushNotification(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('push_notifications').delete().eq('id', id);

  return { error };
}
