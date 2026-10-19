import { type NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';

import { getMercadoPagoClient } from '@/lib/mercadopago/client';
import { isPromoActive, planChargeAmount } from '@/lib/plans/config';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PlanType } from '@/types/plan';

/**
 * Cron diario (vercel.json): al vencer los 12 meses al 50% de una org, sube
 * el monto de su suscripción en Mercado Pago al precio de lista. MP permite
 * cambiar transaction_amount de una preapproval viva; frecuencia y fechas no.
 * Vercel manda `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Sin secreto configurado no corre: si no, cualquiera podría dispararlo.
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: subscriptions, error } = await admin
    .from('subscription')
    .select('id, mp_preapproval_id, plan, amount, currency, organization:organization_id(promo_ends_at)')
    .eq('status', 'authorized');

  if (error) {
    console.error('[cron/subscription-prices]', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const preApproval = new PreApproval(getMercadoPagoClient());
  const results = await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      const org = sub.organization as { promo_ends_at: string | null } | { promo_ends_at: string | null }[] | null;
      const promoEndsAt = Array.isArray(org) ? org[0]?.promo_ends_at : org?.promo_ends_at;
      // Sin fecha (nunca pagó) isPromoActive da true: no hay promo que vencer.
      if (isPromoActive(promoEndsAt)) return 'skipped';

      const target = planChargeAmount(sub.plan as PlanType, false);
      if (Number(sub.amount) >= target) return 'skipped';

      try {
        await preApproval.update({
          id: sub.mp_preapproval_id,
          body: { auto_recurring: { transaction_amount: target, currency_id: sub.currency ?? 'ARS' } },
        });
      } catch (err) {
        // Queda con el monto viejo y se reintenta mañana.
        console.error('[cron/subscription-prices] MP update failed', sub.mp_preapproval_id, err);
        return 'failed';
      }
      await admin
        .from('subscription')
        .update({ amount: target, updated_at: new Date().toISOString() })
        .eq('id', sub.id);
      return 'updated';
    })
  );

  const count = (status: string) => results.filter((r) => r === status).length;
  return NextResponse.json({ updated: count('updated'), failed: count('failed'), skipped: count('skipped') });
}
