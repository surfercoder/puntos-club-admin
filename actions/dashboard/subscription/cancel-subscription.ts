'use server';

import { after } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import { getMercadoPagoClient } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface CancelResult {
  success?: boolean;
  preapprovalId?: string;
  error?: string;
}

/**
 * MercadoPago returns "resource not found" (HTTP 404) when the preapproval ID
 * doesn't exist on their side — either because it's a stale test row or the
 * preapproval was deleted out-of-band. In that case we should still clean up
 * our local DB so the org can recover, instead of leaving the user permanently
 * locked into a phantom paid plan.
 */
function isMpResourceNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; error?: string };
  if (e.status === 404) return true;
  return typeof e.error === 'string' && e.error.toLowerCase() === 'resource not found';
}

/**
 * Cancels the caller's active MercadoPago subscription and reverts their
 * organization to the trial plan.
 *
 * The MP webhook also reverts the org on the cancellation event, but we apply
 * the change here too so the UI updates immediately without waiting on MP.
 */
export async function cancelSubscriptionAction(): Promise<CancelResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'No autenticado' };
    }

    const admin = createAdminClient();

    const { data: appUser } = await admin
      .from('app_user')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!appUser?.organization_id) {
      return { error: 'Organización no encontrada' };
    }

    // Fetch ALL non-cancelled subscriptions for the org — not just the latest.
    // A single org can hold several preapprovals in MercadoPago when the owner
    // retried checkout (switched plans, or paid with a different account before
    // succeeding). Cancelling only the most recent one leaves the others alive
    // and still billing, which is exactly how a "cancelled" org kept being
    // charged. We must cancel every live preapproval.
    const { data: subscriptions } = await admin
      .from('subscription')
      .select('id, mp_preapproval_id, status')
      .eq('organization_id', appUser.organization_id)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    const toCancel = (subscriptions ?? []).filter((s) => s.mp_preapproval_id);

    if (toCancel.length === 0) {
      return { error: 'No hay suscripción activa para cancelar' };
    }

    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);

    // Cancel each preapproval in MP and persist that row as cancelled right
    // after, so a mid-loop failure leaves a consistent partial state and a
    // retry skips the ones already handled (they're no longer non-cancelled).
    await Promise.all(
      toCancel.map(async (sub) => {
        try {
          await preApproval.update({
            id: sub.mp_preapproval_id,
            body: { status: 'cancelled' },
          });
        } catch (mpErr) {
          if (!isMpResourceNotFoundError(mpErr)) throw mpErr;
          after(() =>
            console.warn(
              '[cancel-subscription] MP preapproval not found; proceeding with local cleanup',
              { preapprovalId: sub.mp_preapproval_id },
            ),
          );
        }

        await admin
          .from('subscription')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('id', sub.id);
      }),
    );

    await admin
      .from('organization')
      .update({ plan: 'trial' })
      .eq('id', appUser.organization_id);

    return { success: true, preapprovalId: toCancel[0].mp_preapproval_id };
  } catch (err) {
    console.error('[cancel-subscription]', err);
    return { error: 'Error cancelando suscripción' };
  }
}
