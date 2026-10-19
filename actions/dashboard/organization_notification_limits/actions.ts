"use server";

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { OrganizationNotificationLimitSchema } from '@/schemas/organization_notification_limit.schema';
import type { OrganizationNotificationLimit } from '@/types/organization_notification_limit';
import { requireUser } from '@/lib/auth/require-user';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { errorText, translateError } from '@/lib/error-handler';

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

/**
 * Solo el superadmin: suma (o resta, con un monto negativo) notificaciones al
 * saldo de una org. Va con el cliente del usuario para que la policy de
 * notification_credit también lo exija; el trigger actualiza el total cacheado.
 */
export async function grantNotificationCredits(organizationId: string, amount: number, note: string) {
  await requireUser();

  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser) || !Number.isInteger(amount) || amount === 0) {
    return { error: await errorText('db.forbidden') };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('notification_credit').insert({
    organization_id: Number(organizationId),
    amount,
    source: 'admin',
    note: note.trim() || null,
    created_by: currentUser?.id ?? null,
  });

  if (error) {
    return { error: await translateError(error) };
  }

  revalidatePath('/dashboard/organization_notification_limits');
  return { error: null };
}
