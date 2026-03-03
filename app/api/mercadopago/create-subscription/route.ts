'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago/dist/clients/preApproval';
import { getMercadoPagoClient, getMpPlanId, PLAN_CONFIG, type PlanId } from '@/lib/mercadopago/client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json() as { planId: string };
    const { planId } = body;

    if (!planId || !['advance', 'pro'].includes(planId)) {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const typedPlanId = planId as PlanId;
    const config = PLAN_CONFIG[typedPlanId];
    const mpPlanId = getMpPlanId(typedPlanId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://puntos-club-admin.vercel.app';
    const backUrl = `${siteUrl}/owner/onboarding?step=4`;

    const mp = getMercadoPagoClient();
    const preApproval = new PreApproval(mp);

    const subscription = await preApproval.create({
      body: {
        preapproval_plan_id: mpPlanId,
        reason: `Puntos Club — ${config.name}`,
        payer_email: user.email!,
        back_url: backUrl,
        status: 'pending',
        external_reference: user.id,
      },
    });

    return NextResponse.json({
      initPoint: subscription.init_point,
      preapprovalId: subscription.id,
    });
  } catch (err) {
    console.error('[create-subscription]', err);
    const message = err instanceof Error ? err.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
