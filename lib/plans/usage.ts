'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  OrganizationUsageSummary,
  PlanFeatureKey,
  PlanLimitCheckResult,
  PlanType,
} from '@/types/plan';
import type { ActionState } from '@/lib/error-handler';
import { PLAN_FEATURE_LABELS } from './config';

/**
 * Fetches the full usage summary for an organization via the
 * `get_organization_usage_summary` Postgres function.
 */
export async function getOrganizationUsageSummary(
  orgId: number
): Promise<OrganizationUsageSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_organization_usage_summary', {
    org_id: orgId,
  });

  if (error || !data) return null;
  return data as OrganizationUsageSummary;
}

/**
 * Checks whether creating one more entity of `feature` is allowed
 * under the org's current plan.
 */
export async function checkPlanLimit(
  orgId: number,
  feature: PlanFeatureKey
): Promise<PlanLimitCheckResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_plan_limit', {
    org_id: orgId,
    feature_name: feature,
  });

  if (error || !data) return null;
  return data as PlanLimitCheckResult;
}

/**
 * Fetches all plan limits from the `plan_limits` table.
 * Returns a map of plan -> feature -> limit_value.
 */
export async function getAllPlanLimits(): Promise<Record<PlanType, Record<PlanFeatureKey, number>> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('plan_limits')
    .select('plan, feature, limit_value');

  if (error || !data) return null;

  const result = {} as Record<PlanType, Record<PlanFeatureKey, number>>;
  for (const row of data) {
    const plan = row.plan as PlanType;
    const feature = row.feature as PlanFeatureKey;
    if (!result[plan]) result[plan] = {} as Record<PlanFeatureKey, number>;
    result[plan][feature] = row.limit_value;
  }
  return result;
}

/**
 * Guard helper for server actions.
 *
 * Returns an `ActionState` error if the org has reached its quota for
 * `feature`, or `null` if the action is allowed to proceed.
 *
 * Usage in a form action:
 *   const limitError = await enforcePlanLimit(orgId, 'cashiers');
 *   if (limitError) return limitError;
 */
export async function enforcePlanLimit(
  orgId: number,
  feature: PlanFeatureKey
): Promise<ActionState | null> {
  const result = await checkPlanLimit(orgId, feature);

  if (!result) {
    // Could not determine limit — fail open (allow the action)
    return null;
  }

  if (!result.allowed) {
    const label = PLAN_FEATURE_LABELS[feature];
    return {
      status: 'error' as const,
      message: `Has alcanzado el límite de ${label} (${result.current_usage}/${result.limit_value}) para tu plan ${result.plan}. Actualiza tu plan para continuar.`,
      fieldErrors: {},
    };
  }

  return null;
}
