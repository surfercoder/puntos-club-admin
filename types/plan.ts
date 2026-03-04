export type PlanType = 'trial' | 'advance' | 'pro';

export type PlanFeatureKey =
  | 'beneficiaries'
  | 'push_notifications_monthly'
  | 'cashiers'
  | 'branches'
  | 'collaborators'
  | 'redeemable_products';

export type FeatureUsage = {
  feature: PlanFeatureKey;
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
