'use server';

import { revalidatePath } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { requireUser } from '@/lib/auth/require-user';
import { isAdmin } from '@/lib/auth/roles';
import { cleanFormData, fromErrorToActionState, toActionState, type ActionState } from '@/lib/error-handler';
import { AppError } from '@/lib/errors';
import { pushToAllBeneficiaries } from '@/lib/push';
import { createClient } from '@/lib/supabase/server';
import { ALL_ORGS, PlatformBroadcastSchema, PlatformMessageSchema } from '@/schemas/platform.schema';

/**
 * Mensaje del hilo superadmin <-> organizacion. El superadmin elige la org (o
 * todas); el owner/collaborator siempre escribe en el hilo de su org activa.
 * La RLS de platform_message es la que de verdad impide escribir en otra org.
 */
export async function sendPlatformMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const form = cleanFormData(formData);
    const parsed = PlatformMessageSchema.safeParse(form);
    if (!parsed.success) return await fromErrorToActionState(parsed.error);

    const supabase = await createClient();
    const fromPlatform = isAdmin(user);
    let orgIds: number[];

    if (fromPlatform) {
      if (form.organization_id === ALL_ORGS) {
        const { data, error } = await supabase.from('organization').select('id');
        if (error) throw error;
        orgIds = data.map((o) => Number(o.id));
      } else {
        orgIds = [Number(form.organization_id)];
      }
    } else {
      const orgId = await getActiveOrgIdFilter(user);
      orgIds = orgId ? [orgId] : [];
    }

    if (orgIds.length === 0 || orgIds.some((id) => !Number.isFinite(id) || id <= 0)) {
      throw new AppError('organization.noActive');
    }

    const { error } = await supabase.from('platform_message').insert(
      orgIds.map((organization_id) => ({
        organization_id,
        sender_id: Number(user.id),
        from_platform: fromPlatform,
        body: parsed.data.body,
      })),
    );
    if (error) throw error;

    revalidatePath('/dashboard/messages');
    return await toActionState('platformMessageSent');
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}

/** Marca como leidos los mensajes del otro lado del hilo (ver la RPC). */
export async function markPlatformMessagesRead(orgId: number): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('mark_platform_messages_read', { p_org: orgId });
}

/**
 * Comunicado del superadmin: push a todos los beneficiarios de la plataforma.
 * No descuenta saldo de ninguna org: no pasa por push_notifications.
 */
export async function sendPlatformBroadcastAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    if (!isAdmin(user)) throw new AppError('db.forbidden');

    const parsed = PlatformBroadcastSchema.safeParse(cleanFormData(formData));
    if (!parsed.success) return await fromErrorToActionState(parsed.error);

    const { title, body } = parsed.data;
    const { sent, failed } = await pushToAllBeneficiaries({
      title,
      body,
      data: { type: 'platform_broadcast' },
    });

    const supabase = await createClient();
    const { error } = await supabase.from('platform_broadcast').insert({
      created_by: Number(user.id),
      title,
      body,
      sent_count: sent,
      failed_count: failed,
    });
    if (error) throw error;

    revalidatePath('/dashboard/broadcasts');
    const t = await getTranslations('Actions');
    return { status: 'success', message: t('platformBroadcastSent', { sent, failed }), fieldErrors: {} };
  } catch (error) {
    return await fromErrorToActionState(error);
  }
}
