import { createAdminClient } from '@/lib/supabase/admin';
import type { PlanFeatureKey, PlanType } from '@/types/plan';
import { groupPlanLimits } from './config';

/**
 * Límites de los planes para la landing. `plan_limits` sólo es legible por
 * `authenticated`, y el visitante de la home es anónimo: se lee con service role.
 * Si falla, la landing se muestra sin la grilla de planes.
 */
export async function getPublicPlanLimits(): Promise<Record<PlanType, Record<PlanFeatureKey, number>> | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('plan_limits')
      .select('plan, feature, limit_value');
    if (error || !data) return null;
    return groupPlanLimits(data);
  } catch {
    return null;
  }
}
