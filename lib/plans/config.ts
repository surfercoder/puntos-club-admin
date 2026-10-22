import type { PlanFeatureKey, PlanFlagKey, PlanQuotaKey, PlanType } from '@/types/plan';

/** Warning threshold: show alert when usage reaches this fraction of the limit */
export const WARNING_THRESHOLD = 0.8;

/**
 * limit_value = -1 significa "sin límite".
 * Los flags usan la misma columna: 1 = incluido, 0 = no incluido.
 */
export const UNLIMITED = -1;

/** Planes de menor a mayor. El último es el tope: no hay a qué actualizar. */
export const PLAN_ORDER: PlanType[] = ['trial', 'advance', 'pro', 'enterprise'];

export const TOP_PLAN: PlanType = PLAN_ORDER[PLAN_ORDER.length - 1];

/** Cuotas contables, en el orden en que se muestran */
export const PLAN_QUOTA_ORDER: PlanQuotaKey[] = [
  'beneficiaries',
  'redeemable_products',
  'push_notifications_monthly',
  'cashiers',
  'branches',
  'collaborators',
];

/** Flags de incluido / no incluido, en el orden en que se muestran */
export const PLAN_FLAG_ORDER: PlanFlagKey[] = [
  'beneficiary_map',
  'exports',
  'private_club',
  'virtual_cashier',
  'campaigns',
  'api',
  'webhooks',
  'sso',
  'white_label',
  'advanced_roles',
  'audit',
  'erp_integration',
  'sla',
  'priority_support',
  'trained_ai',
  'account_manager',
];

/** Las 22 features del plan, cuotas primero */
export const PLAN_FEATURE_ORDER: PlanFeatureKey[] = [
  ...PLAN_QUOTA_ORDER,
  ...PLAN_FLAG_ORDER,
];

/** Filas de `plan_limits` → plan -> feature -> limit_value */
export function groupPlanLimits(
  rows: { plan: string; feature: string; limit_value: number }[]
): Record<PlanType, Record<PlanFeatureKey, number>> {
  const result = {} as Record<PlanType, Record<PlanFeatureKey, number>>;
  for (const row of rows) {
    const plan = row.plan as PlanType;
    if (!result[plan]) result[plan] = {} as Record<PlanFeatureKey, number>;
    result[plan][row.feature as PlanFeatureKey] = row.limit_value;
  }
  return result;
}

export function isQuotaFeature(feature: PlanFeatureKey): feature is PlanQuotaKey {
  return PLAN_QUOTA_ORDER.some((quota) => quota === feature);
}

/**
 * Cuotas: -1 (sin límite) o un tope >= 0. Flags: sólo 0 o 1 — cualquier otro
 * valor haría que check_plan_limit() los lea como incluidos.
 */
export function isValidLimitValue(feature: PlanFeatureKey, value: number): boolean {
  return isQuotaFeature(feature) ? value >= UNLIMITED : value === 0 || value === 1;
}

/** Etiquetas para mensajes de error del servidor (la UI usa next-intl) */
export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  beneficiaries:              'Beneficiarios',
  redeemable_products:        'Premios por catálogo',
  push_notifications_monthly: 'Notificaciones incluidas',
  cashiers:                   'Cajeros',
  branches:                   'Sucursales',
  collaborators:              'Colaboradores',
  beneficiary_map:            'Mapa de beneficiarios',
  exports:                    'Exportaciones',
  private_club:               'Club privado',
  virtual_cashier:            'Cajero virtual',
  campaigns:                  'Campañas',
  api:                        'API',
  webhooks:                   'Webhooks',
  sso:                        'SSO',
  white_label:                'Colores de tu marca en la app',
  advanced_roles:             'Roles avanzados',
  audit:                      'Auditoría',
  erp_integration:            'Integración ERP',
  sla:                        'SLA',
  priority_support:           'Soporte prioritario',
  trained_ai:                 'IA entrenada',
  account_manager:            'Account Manager',
};

/** Lucide icon name for each quota (used in UI components) */
export const PLAN_FEATURE_ICONS: Record<PlanQuotaKey, string> = {
  beneficiaries:              'Users',
  redeemable_products:        'Gift',
  push_notifications_monthly: 'Bell',
  cashiers:                   'UserCheck',
  branches:                   'Store',
  collaborators:              'UserCog',
};

/** Plan display names */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  trial:      'Plan Trial',
  advance:    'Plan Advance',
  pro:        'Plan Pro',
  enterprise: 'Plan Enterprise',
};

/** Precio mensual en ARS. null = se vende por contacto comercial. */
export const PLAN_PRICES: Record<PlanType, number | null> = {
  trial:      0,
  advance:    12499,
  pro:        31200,
  enterprise: null,
};

/** Precio de lista: tachado en las tarjetas durante la promo, y lo que cobra MP cuando vence (planChargeAmount). */
export const PLAN_LIST_PRICES: Partial<Record<PlanType, number>> = {
  advance: 24999,
  pro:     62400,
};

/** Planes que muestran las tarjetas. Enterprise se vende por contacto y no aparece. */
export const PLAN_CARD_ORDER = ['trial', 'advance', 'pro'] as const satisfies readonly PlanType[];
export type PlanCardType = (typeof PLAN_CARD_ORDER)[number];

/** Filas de las tarjetas, en el orden curado del diseño */
export const PLAN_CARD_FEATURES = [
  'beneficiaries',
  'redeemable_products',
  'push_notifications_monthly',
  'cashiers',
  'branches',
  'collaborators',
  'beneficiary_map',
  'private_club',
  'campaigns',
] as const satisfies readonly PlanFeatureKey[];
export type PlanCardFeature = (typeof PLAN_CARD_FEATURES)[number];

/** Meses al 50% desde la primera suscripción autorizada de la org. */
export const PROMO_MONTHS = 12;

/**
 * Días antes de promo_ends_at en que ya se cobra el precio de lista: el cron
 * corre una vez por día y MP cobra el día del aniversario, así el pago 13
 * nunca sale con descuento.
 */
export const PROMO_END_MARGIN_DAYS = 3;

/** Sin promo_ends_at la org nunca pagó: la promo arranca con su primer pago. */
export function isPromoActive(promoEndsAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!promoEndsAt) return true;
  const cutoff = new Date(promoEndsAt).getTime() - PROMO_END_MARGIN_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() < cutoff;
}

/** Lo que cobra MP por un plan pago: 50% en promo, precio de lista después. */
export function planChargeAmount(plan: PlanType, promoActive: boolean): number {
  const promo = PLAN_PRICES[plan] ?? 0;
  return promoActive ? promo : PLAN_LIST_PRICES[plan] ?? promo;
}

/** Planes que se pagan con Mercado Pago (los que tienen precio > 0) */
export function isPaidPlan(plan: PlanType): boolean {
  const price = PLAN_PRICES[plan];
  return price !== null && price > 0;
}

/** Enterprise no tiene checkout: se cierra por comercial. */
export function isContactSalesPlan(plan: PlanType): boolean {
  return PLAN_PRICES[plan] === null;
}

/** Color de marca por plan. Las clases de Tailwind viven en los mapas de la UI. */
export const PLAN_COLORS: Record<PlanType, string> = {
  trial:      'blue',
  advance:    'orange',
  pro:        'green',
  enterprise: 'violet',
};

export function planColor(plan: PlanType): string {
  return PLAN_COLORS[plan];
}

export const planButtonColorMap: Record<string, string> = {
  green:  'bg-brand-green hover:bg-brand-green/90 text-white',
  blue:   'bg-brand-blue hover:bg-brand-blue/90 text-white',
  orange: 'bg-brand-orange hover:bg-brand-orange/90 text-white',
  pink:   'bg-brand-pink hover:bg-brand-pink/90 text-white',
  violet: 'bg-brand-violet hover:bg-brand-violet/90 text-white',
};
