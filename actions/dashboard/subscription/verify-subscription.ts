'use server';

import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import type { PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { getMercadoPagoClient, type PlanId } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function verifySubscriptionAction(
  preapprovalId: string
): Promise<{ status?: string; plan?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'No autenticado' };
    }

    if (!preapprovalId) {
      return { error: 'preapprovalId requerido' };
    }

    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);
    const subscription = (await preApproval.get({
      id: preapprovalId,
    })) as PreApprovalResponse & {
      external_reference?: string;
    };

    const mpStatus = subscription.status as string;

    const statusMap: Record<string, string> = {
      authorized: 'authorized',
      pending: 'pending',
      paused: 'paused',
      cancelled: 'cancelled',
    };
    const mappedStatus = statusMap[mpStatus] ?? 'pending';

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('subscription')
      .select('id, organization_id, plan')
      .eq('mp_preapproval_id', preapprovalId)
      .maybeSingle();

    if (existing) {
      await admin
        .from('subscription')
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (mappedStatus === 'authorized') {
        await admin
          .from('organization')
          .update({ plan: existing.plan })
          .eq('id', existing.organization_id);
      }

      return { status: mappedStatus, plan: existing.plan };
    }

    const externalRef = subscription.external_reference as string | undefined;
    const planPart = externalRef?.split('|')[1];
    const plan: PlanId =
      planPart && ['advance', 'pro'].includes(planPart)
        ? (planPart as PlanId)
        : 'advance';

    return { status: mappedStatus, plan };
  } catch (err) {
    console.error('[verify-subscription]', err);
    return { error: 'Error verificando suscripción' };
  }
}
