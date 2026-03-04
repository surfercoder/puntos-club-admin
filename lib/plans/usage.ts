'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  OrganizationUsageSummary,
  PlanFeatureKey,
  PlanLimitCheckResult,
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
      message: `Has alcanzado el límite de ${label} (${result.current_usage}/${result.limit_value}) para tu plan ${result.plan}. Actualiza tu plan para continuar.`,
      fieldErrors: {},
    };
  }

  return null;
}
