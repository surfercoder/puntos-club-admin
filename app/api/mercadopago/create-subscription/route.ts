'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import { getMercadoPagoClient, PLAN_CONFIG, type PlanId } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Create a subscription without associated plan (status: pending).
 * User is redirected to MercadoPago checkout; no card_token_id required.
 * @see https://www.mercadopago.com.ar/developers/en/docs/subscriptions/integration-configuration/subscription-no-associated-plan/pending-payments
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json() as { planId: string; backUrl?: string; payerEmail?: string };
    const { planId, backUrl: customBackUrl, payerEmail: requestedPayerEmailRaw } = body;

    if (!planId || !['advance', 'pro'].includes(planId)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    // The payer's email can differ from the registration email: owners often
    // register with a company address but pay with the treasury/billing account.
    // MercadoPago requires the account that completes checkout to match this email.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const requestedPayerEmail =
      typeof requestedPayerEmailRaw === 'string' ? requestedPayerEmailRaw.trim().toLowerCase() : '';

    if (requestedPayerEmail && !emailRegex.test(requestedPayerEmail)) {
      return NextResponse.json({ error: 'El email de pago no es válido' }, { status: 400 });
    }

    const typedPlanId = planId as PlanId;
    const config = PLAN_CONFIG[typedPlanId];

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.puntosclub.com.ar').trim().replace(/\/+$/, '');
    const backUrl = customBackUrl
      ? `${siteUrl}${customBackUrl}`
      : `${siteUrl}/owner/onboarding?step=4`;
    try {
      new URL(backUrl); // validate it's an absolute URL
    } catch {
      console.error('[create-subscription] Invalid NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
      return NextResponse.json(
        {
          error:
            'back_url inválida. Verifica que NEXT_PUBLIC_SITE_URL sea una URL absoluta (ej: https://tu-dominio.com). Para pruebas locales, MercadoPago puede rechazar localhost; usa ngrok: `ngrok http 3001` y pon la URL de ngrok en NEXT_PUBLIC_SITE_URL.',
        },
        { status: 500 }
      );
    }

    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);

    // The owner types, at each checkout, the Mercado Pago account they'll pay with —
    // exactly like the onboarding step. It defaults to their registration email but can be
    // any account, and it can differ between onboarding and each later upgrade (they are
    // never locked to a single account). MercadoPago requires the account completing
    // checkout to match this email, and it cannot be the collector's own account
    // (you can't subscribe yourself).
    const payerEmail = requestedPayerEmail || user.email;

    if (!payerEmail) {
      return NextResponse.json({ error: 'payer_email is required' }, { status: 400 });
    }

    // Subscription WITHOUT plan + status pending = redirect to MP checkout, no card_token_id
    const subscription = await preApproval.create({
      body: {
        reason: `Puntos Club — ${config.name}`,
        payer_email: payerEmail,
        external_reference: `${user.id}|${typedPlanId}`, // webhook parses plan from here
        back_url: backUrl,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          start_date: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          transaction_amount: config.amount,
          currency_id: config.currency,
        },
      },
    });

    // Persist the subscription record so the webhook can find it later
    const { data: appUser } = await createAdminClient()
      .from('app_user')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (appUser?.organization_id && subscription.id) {
      await createAdminClient().from('subscription').upsert(
        {
          organization_id: Number(appUser.organization_id),
          mp_preapproval_id: subscription.id,
          mp_plan_id: typedPlanId,
          plan: typedPlanId,
          status: 'pending',
          // Seed with the chosen payer email; the webhook later overwrites it
          // with MP's confirmed value (the account that actually paid).
          payer_email: payerEmail,
          amount: config.amount,
          currency: config.currency,
        },
        { onConflict: 'mp_preapproval_id' }
      );
    }

    return NextResponse.json({
      initPoint: subscription.init_point,
      preapprovalId: subscription.id,
    });
  } catch (err) {
    console.error('[create-subscription]', err);

    // MercadoPago SDK throws response.json() on API errors (not Error instances)
    const e = err as { message?: string; error?: string; cause?: unknown };
    let message =
      err instanceof Error
        ? err.message
        : typeof e?.message === 'string'
          ? e.message
          : typeof e?.error === 'string'
            ? e.error
            : Array.isArray(e?.cause) && e.cause.length > 0
              ? String((e.cause as { message?: string }[])[0]?.message ?? e.cause[0])
              : 'Error inesperado';

    if (typeof message === 'string' && message.toLowerCase().includes('back_url')) {
      message += ' MercadoPago puede rechazar localhost; usa ngrok (ngrok http 3001) y pon la URL en NEXT_PUBLIC_SITE_URL.';
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
