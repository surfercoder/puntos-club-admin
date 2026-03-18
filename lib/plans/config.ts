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
