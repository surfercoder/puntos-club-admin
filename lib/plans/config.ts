import type { PlanFeatureKey, PlanType } from '@/types/plan';

/** Warning threshold: show alert when usage reaches this fraction of the limit */
export const WARNING_THRESHOLD = 0.8;

/** Human-readable labels for each feature key */
export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  beneficiaries:              'Beneficiarios',
  push_notifications_monthly: 'Notificaciones / mes',
  cashiers:                   'Cajeros',
  branches:                   'Sucursales',
  collaborators:               'Usuarios colaboradores',
  redeemable_products:        'Premios canjeables',
};

/** Lucide icon name for each feature (used in UI components) */
export const PLAN_FEATURE_ICONS: Record<PlanFeatureKey, string> = {
  beneficiaries:              'Users',
  push_notifications_monthly: 'Bell',
  cashiers:                   'UserCheck',
  branches:                   'Store',
  collaborators:               'UserCog',
  redeemable_products:        'Gift',
};

/**
 * Static copy of the plan limits (mirrors the `plan_limits` DB table).
 * Use this for UI rendering that does not need a DB round-trip.
 * Always treat the DB as the authoritative source for enforcement.
 */
export const PLAN_LIMITS_CONFIG: Record<PlanType, Record<PlanFeatureKey, number>> = {
  trial: {
    beneficiaries:               100,
    push_notifications_monthly:    3,
    cashiers:                      1,
    branches:                      1,
    collaborators:                  1,
    redeemable_products:           2,
  },
  advance: {
    beneficiaries:               500,
    push_notifications_monthly:   10,
    cashiers:                     10,
    branches:                      5,
    collaborators:                  3,
    redeemable_products:          10,
  },
  pro: {
    beneficiaries:              5000,
    push_notifications_monthly:   50,
    cashiers:                    100,
    branches:                     15,
    collaborators:                 10,
    redeemable_products:          30,
  },
};

/** Plan display names */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  trial:   'Plan Trial',
  advance: 'Plan Advance',
  pro:     'Plan Pro',
};

/** Ordered list of feature keys for consistent rendering */
export const PLAN_FEATURE_ORDER: PlanFeatureKey[] = [
  'beneficiaries',
  'push_notifications_monthly',
  'cashiers',
  'branches',
  'collaborators',
  'redeemable_products',
];
