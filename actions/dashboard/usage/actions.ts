'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getOrganizationUsageSummary,
  checkPlanLimit,
  getAllPlanLimits,
} from '@/lib/plans/usage';
import type { PlanFeatureKey } from '@/types/plan';

/**
 * Resolves the authenticated user's organization ID.
 * Returns null when the user is not authenticated or has no org.
 */
async function getAuthenticatedOrgId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: appUser } = await supabase
    .from('app_user')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single();

  return (appUser?.organization_id as number) ?? null;
}

/**
 * Returns the full usage summary for the authenticated user's organization.
 * Suitable for dashboard widgets and usage overview pages.
 */
export async function getUsageSummaryAction() {
  const orgId = await getAuthenticatedOrgId();
  if (!orgId) return null;
  return getOrganizationUsageSummary(orgId);
}

/**
 * Returns all plan limits from the database (for all plans).
 * Used to display plan comparison cards with up-to-date values.
 */
export async function getAllPlanLimitsAction() {
  return getAllPlanLimits();
}

/**
 * Checks a specific feature limit for the authenticated user's organization.
 * Useful for pre-flight checks before showing "create" buttons in the UI.
 */
export async function checkFeatureLimitAction(feature: PlanFeatureKey) {
  const orgId = await getAuthenticatedOrgId();
  if (!orgId) return null;
  return checkPlanLimit(orgId, feature);
}
