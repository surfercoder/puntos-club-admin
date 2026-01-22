"use server";

import { createClient } from '@/lib/supabase/server';
import { PushNotificationRecipientSchema } from '@/schemas/push_notification_recipient.schema';
import type { PushNotificationRecipient } from '@/types/push_notification_recipient';

export async function createPushNotificationRecipient(input: PushNotificationRecipient) {
  const parsed = PushNotificationRecipientSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_notification_recipients').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updatePushNotificationRecipient(id: string, input: PushNotificationRecipient) {
  const parsed = PushNotificationRecipientSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('push_notification_recipients').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deletePushNotificationRecipient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('push_notification_recipients').delete().eq('id', id);

  return { error };
}
