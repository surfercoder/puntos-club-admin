import MercadoPago from 'mercadopago';

import { PLAN_PRICES } from '@/lib/plans/config';

let _client: MercadoPago | null = null;

export function getMercadoPagoClient(): MercadoPago {
  if (!_client) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN env var is not set');
    }
    _client = new MercadoPago({ accessToken });
  }
  return _client;
}

export type PlanId = 'advance' | 'pro';

export interface PlanConfig {
  id: PlanId;
  name: string;
  mpPlanIdEnvVar: string;
  amount: number;
  currency: 'ARS';
}

export const PLAN_CONFIG: Record<PlanId, PlanConfig> = {
  advance: {
    id: 'advance',
    name: 'Plan Advance',
    mpPlanIdEnvVar: 'MP_PLAN_ID_ADVANCE',
    amount: PLAN_PRICES.advance as number,
    currency: 'ARS',
  },
  pro: {
    id: 'pro',
    name: 'Plan Pro',
    mpPlanIdEnvVar: 'MP_PLAN_ID_PRO',
    amount: PLAN_PRICES.pro as number,
    currency: 'ARS',
  },
};

