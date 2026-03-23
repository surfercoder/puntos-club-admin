'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import type { PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { getMercadoPagoClient, type PlanId } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Verify a subscription status with MercadoPago after the user returns from checkout.
 * If the subscription is authorized, update the DB immediately (don't wait for webhook).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json() as { preapprovalId: string };
    const { preapprovalId } = body;

    if (!preapprovalId) {
      return NextResponse.json({ error: 'preapprovalId requerido' }, { status: 400 });
    }

    // Fetch current status from MercadoPago
    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);
    const subscription = await preApproval.get({ id: preapprovalId }) as PreApprovalResponse & {
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

    // Find existing subscription record
    const { data: existing } = await admin
      .from('subscription')
      .select('id, organization_id, plan')
      .eq('mp_preapproval_id', preapprovalId)
      .maybeSingle();

    if (existing) {
      // Update subscription status
      await admin
        .from('subscription')
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      // If authorized, update organization plan
      if (mappedStatus === 'authorized') {
        await admin
          .from('organization')
          .update({ plan: existing.plan })
          .eq('id', existing.organization_id);
      }

      return NextResponse.json({
        status: mappedStatus,
        plan: existing.plan,
      });
    }

    // No record found — try to resolve from external_reference (fallback)
    const externalRef = subscription.external_reference as string | undefined;
    const planPart = externalRef?.split('|')[1];
    const plan: PlanId = planPart && ['advance', 'pro'].includes(planPart)
      ? (planPart as PlanId)
      : 'advance';

    return NextResponse.json({
      status: mappedStatus,
      plan,
    });
  } catch (err) {
    console.error('[verify-subscription]', err);
    return NextResponse.json({ error: 'Error verificando suscripción' }, { status: 500 });
  }
}
