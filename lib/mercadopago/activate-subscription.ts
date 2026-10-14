import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import { getMercadoPagoClient } from '@/lib/mercadopago/client';
import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * A preapproval was just authorized: move the org to its plan and only THEN
 * cancel every other live preapproval of the org (the plan it switched away
 * from, abandoned checkouts). Cancelling the old plan before checkout left
 * paying orgs on trial whenever they backed out of Mercado Pago.
 */
export async function activateSubscription(
  admin: AdminClient,
  { organizationId, plan, preapprovalId }: { organizationId: number; plan: string; preapprovalId: string }
) {
  await admin.from('organization').update({ plan }).eq('id', organizationId);

  const { data: others } = await admin
    .from('subscription')
    .select('id, mp_preapproval_id')
    .eq('organization_id', organizationId)
    .neq('status', 'cancelled')
    .neq('mp_preapproval_id', preapprovalId);

  const preApproval = new PreApproval(getMercadoPagoClient());
  await Promise.all(
    (others ?? []).map(async (sub) => {
      try {
        await preApproval.update({ id: sub.mp_preapproval_id, body: { status: 'cancelled' } });
      } catch (err) {
        // Leave the row live so it stays visible (and cancellable) instead of
        // silently billing in MP while our DB says cancelled.
        console.error('[activate-subscription] could not cancel previous preapproval', sub.mp_preapproval_id, err);
        return;
      }
      await admin
        .from('subscription')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', sub.id);
    })
  );
}
