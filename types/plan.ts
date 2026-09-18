export type PlanType = 'trial' | 'advance' | 'pro' | 'enterprise';

/** Cuotas contables: limit_value es un tope (-1 = sin límite). */
export type PlanQuotaKey =
  | 'beneficiaries'
  | 'redeemable_products'
  | 'push_notifications_monthly'
  | 'cashiers'
  | 'branches'
  | 'collaborators';

/** Flags de "incluido / no incluido": limit_value es 1 o 0. */
export type PlanFlagKey =
  | 'beneficiary_map'
  | 'exports'
  | 'private_club'
  | 'virtual_cashier'
  | 'campaigns'
  | 'api'
  | 'webhooks'
  | 'sso'
  | 'white_label'
  | 'advanced_roles'
  | 'audit'
  | 'erp_integration'
  | 'sla'
  | 'priority_support'
  | 'trained_ai'
  | 'account_manager';

export type PlanFeatureKey = PlanQuotaKey | PlanFlagKey;

export type FeatureUsage = {
  feature: PlanQuotaKey;
  limit_value: number;
  current_usage: number;
  usage_percentage: number;
  is_at_limit: boolean;
  should_warn: boolean;
  warning_threshold: number;
};

export type OrganizationUsageSummary = {
  plan: PlanType;
  features: FeatureUsage[];
};

export type PlanLimitCheckResult = {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  usage_percentage: number;
  should_warn: boolean;
  plan: PlanType;
  feature: PlanFeatureKey;
  reason?: string;
};

export type PlanLimit = {
  id: number;
  plan: PlanType;
  feature: PlanFeatureKey;
  limit_value: number;
  warning_threshold: number;
  created_at: string;
  updated_at: string;
};
