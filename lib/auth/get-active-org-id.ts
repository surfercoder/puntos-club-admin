import { cookies } from 'next/headers';

import type { AppUserWithRelations } from '@/types/app_user';
import { createClient } from '@/lib/supabase/server';

import { isAdmin } from './roles';

/**
 * True when the user has an active membership row for `orgId`.
 * Owners/collaborators have `has_admin_portal_access()` RLS on most tables,
 * so an unvalidated cookie would let them read a foreign org's data — this is
 * the gate that keeps the active-org cookie from crossing that boundary.
 */
async function belongsToOrg(
  appUserId: string,
  orgId: number,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('app_user_organization')
    .select('organization_id')
    .eq('app_user_id', appUserId)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .maybeSingle();
  return !!data;
}

/**
 * Resolves the org_id to use for scoping a server-side query.
 *
 * Admins always return `null` (cross-org view) — matching the existing portal
 * model where admins see every organization and the org switcher does not
 * write the cookie for them.
 *
 * For everyone else, returns the `active_org_id` cookie when present and valid,
 * falling back to `currentUser.organization_id`. The fallback is what closes
 * the cross-org leak: server renders that arrive before the client has written
 * the cookie still get scoped to the user's primary org instead of leaking
 * every org's rows.
 */
export async function getActiveOrgIdFilter(
  currentUser: AppUserWithRelations | null,
): Promise<number | null> {
  if (isAdmin(currentUser)) {
    return null;
  }

  const fallback = currentUser?.organization_id
    ? Number(currentUser.organization_id)
    : NaN;
  const fallbackValid = Number.isFinite(fallback) && fallback > 0;

  const cookieStore = await cookies();
  const raw = cookieStore.get('active_org_id')?.value;
  const parsed = raw ? Number(raw) : NaN;
  // Honor the cookie only when it points at an org the user actually belongs to.
  // A stale/foreign cookie (e.g. a deleted org, or another org left in
  // localStorage across account switches) otherwise scopes every list to a
  // phantom org — empty results — or leaks another org's rows.
  if (Number.isFinite(parsed) && parsed > 0 && currentUser) {
    if (parsed === fallback || (await belongsToOrg(currentUser.id, parsed))) {
      return parsed;
    }
  }

  return fallbackValid ? fallback : null;
}
