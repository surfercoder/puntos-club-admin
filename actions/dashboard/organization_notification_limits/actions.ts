"use server";

import { createClient } from '@/lib/supabase/server';
import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';

export async function createOrganizationNotificationLimit(input: OrganizationNotificationLimit) {
  const parsed = OrganizationNotificationLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization_notification_limits').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateOrganizationNotificationLimit(id: string, input: OrganizationNotificationLimit) {
  const parsed = OrganizationNotificationLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('organization_notification_limits').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteOrganizationNotificationLimit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('organization_notification_limits').delete().eq('id', id);

  return { error };
}
