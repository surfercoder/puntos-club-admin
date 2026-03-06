/**
 * One-time script to create the Advance and Pro subscription plans
 * in Mercado Pago. Run once per environment (test + production).
 *
 * Usage:
 *   npm run setup:mp-plans
 *
 * After running, copy the printed plan IDs into your .env.local:
 *   MP_PLAN_ID_ADVANCE=...
 *   MP_PLAN_ID_PRO=...
 *
 * For local testing: see docs/mercadopago-local-testing.md
 */
import 'dotenv/config';
import MercadoPago from 'mercadopago';
import { PreApprovalPlan } from 'mercadopago/dist/clients/preApprovalPlan';

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
if (!accessToken) {
  console.error('❌  MERCADOPAGO_ACCESS_TOKEN is not set in .env.local');
  process.exit(1);
}

const mp = new MercadoPago({ accessToken });
const preApprovalPlan = new PreApprovalPlan(mp);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://puntos-club-admin.vercel.app';

const plans = [
  {
    key: 'MP_PLAN_ID_ADVANCE',
    body: {
      reason: 'Puntos Club — Plan Advance',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months' as const,
        transaction_amount: 50,
        currency_id: 'ARS',
      },
      back_url: `${siteUrl}/owner/onboarding`,
      payment_methods_allowed: {
        payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
      },
    },
  },
  {
    key: 'MP_PLAN_ID_PRO',
    body: {
      reason: 'Puntos Club — Plan Pro',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months' as const,
        transaction_amount: 89,
        currency_id: 'ARS',
      },
      back_url: `${siteUrl}/owner/onboarding`,
      payment_methods_allowed: {
        payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }],
      },
    },
  },
];

async function main() {
  console.warn('🚀  Creating Mercado Pago subscription plans...\n');

  const results: Record<string, string> = {};

  for (const plan of plans) {
    try {
      const result = await preApprovalPlan.create({ body: plan.body });
      const id = result.id as string;
      results[plan.key] = id;
      console.warn(`✅  ${plan.key}=${id}`);
    } catch (err) {
      console.error(`❌  Failed to create plan for ${plan.key}:`, err);
    }
  }

  console.warn('\n📋  Add these to your .env.local and Vercel environment variables:\n');
  for (const [key, value] of Object.entries(results)) {
    console.warn(`${key}=${value}`);
  }
}

main();
