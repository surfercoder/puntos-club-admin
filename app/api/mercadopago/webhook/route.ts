'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import type { PreApprovalResponse } from 'mercadopago/dist/clients/preApproval/commonTypes';
import { getMercadoPagoClient, PLAN_CONFIG, type PlanId } from '@/lib/mercadopago/client';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Mercado Pago sends webhook notifications for subscription events.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Expected events:
 *  - subscription_preapproval: status changes (authorized, paused, cancelled)
 *  - subscription_authorized_payment: payment was processed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request comes from MP using the secret header
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    if (webhookSecret && xSignature) {
      // MP signs: ts=<timestamp>,v1=<hmac-sha256(secret, "id:<notifId>;request-id:<xRequestId>;ts:<ts>")>
      // For now we log; implement HMAC verification before going to production.
      void xSignature; void xRequestId;
    }

    const body = await request.json() as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };

    // MP sends different payload shapes. Normalize the subscription id.
    const eventType = body.type ?? '';
    const preapprovalId = body.data?.id;

    if (!preapprovalId) {
      return NextResponse.json({ received: true });
    }

    // We only care about subscription state changes
    if (eventType !== 'subscription_preapproval' && eventType !== 'subscription_authorized_payment') {
      return NextResponse.json({ received: true });
    }

    // Fetch the latest state from MP
    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);
    const subscription = await preApproval.get({ id: preapprovalId }) as PreApprovalResponse & {
      preapproval_plan_id?: string;
      external_reference?: string;
    };

    const mpStatus = subscription.status as string;
    const mpPlanId = subscription.preapproval_plan_id as string;

    // Map MP status to our status
    const statusMap: Record<string, string> = {
      authorized: 'authorized',
      pending: 'pending',
      paused: 'paused',
      cancelled: 'cancelled',
    };
    const mappedStatus = statusMap[mpStatus] ?? 'pending';

    const admin = createAdminClient();

    // Find the existing subscription record by mp_preapproval_id
    const { data: existing } = await admin
      .from('subscription')
      .select('id, organization_id, plan')
      .eq('mp_preapproval_id', preapprovalId)
      .maybeSingle();

    if (existing) {
      // Update status
      await admin
        .from('subscription')
        .update({ status: mappedStatus, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      // If subscription is now authorized, update org plan too
      if (mappedStatus === 'authorized') {
        await admin
          .from('organization')
          .update({ plan: existing.plan })
          .eq('id', existing.organization_id);
      }

      // If cancelled/paused, revert org to trial
      if (mappedStatus === 'cancelled') {
        await admin
          .from('organization')
          .update({ plan: 'trial' })
          .eq('id', existing.organization_id);
      }
    } else {
      // Subscription not in our DB yet (edge case: webhook arrived before onboarding step 5)
      // Determine plan from MP plan ID
      const planEntry = Object.entries(PLAN_CONFIG).find(
        ([, cfg]) => process.env[cfg.mpPlanIdEnvVar] === mpPlanId
      );
      const plan = (planEntry?.[0] as PlanId | undefined) ?? 'advance';

      // We need the organization; use external_reference = auth user id set during creation
      const authUserId = subscription.external_reference as string | undefined;
      if (authUserId) {
        const { data: appUser } = await admin
          .from('app_user')
          .select('organization_id')
          .eq('auth_user_id', authUserId)
          .maybeSingle();

        if (appUser?.organization_id) {
          const config = PLAN_CONFIG[plan];
          await admin.from('subscription').upsert(
            {
              organization_id: Number(appUser.organization_id),
              mp_preapproval_id: preapprovalId,
              mp_plan_id: mpPlanId,
              plan,
              status: mappedStatus,
              payer_email: (subscription.payer_email as string) ?? '',
              amount: config.amount,
              currency: config.currency,
            },
            { onConflict: 'mp_preapproval_id' }
          );

          if (mappedStatus === 'authorized') {
            await admin
              .from('organization')
              .update({ plan })
              .eq('id', appUser.organization_id);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[mp-webhook]', err);
    // Always return 200 to avoid MP retrying indefinitely on our errors
    return NextResponse.json({ received: true });
  }
}
