import type { PlanType, PlanFeatureKey } from './plan';

export type OrganizationPlanLimit = {
  id: string;
  organization_id: string;
  plan: PlanType;
  feature: PlanFeatureKey;
  limit_value: number;
  warning_threshold: number;
  snapshotted_at: string;
  created_at: string;
  updated_at: string;
};

