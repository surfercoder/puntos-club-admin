"use server";

import { createAdminClient } from '@/lib/supabase/admin';
import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import { requireUser } from '@/lib/auth/require-user';

export async function createOrganizationNotificationLimit(input: OrganizationNotificationLimit) {
  await requireUser();
  const parsed = OrganizationNotificationLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('organization_notification_limits').insert([parsed.data]).select().single();

  return { data, error };
}

export async function updateOrganizationNotificationLimit(id: string, input: OrganizationNotificationLimit) {
  await requireUser();
  const parsed = OrganizationNotificationLimitSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(err => {
      if (err.path[0]) {fieldErrors[err.path[0] as string] = err.message;}
    });

    return { error: { fieldErrors } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from('organization_notification_limits').update(parsed.data).eq('id', id).select().single();

  return { data, error };
}

export async function deleteOrganizationNotificationLimit(id: string) {
  await requireUser();
  const supabase = createAdminClient();
  const { error } = await supabase.from('organization_notification_limits').delete().eq('id', id);

  return { error };
}
