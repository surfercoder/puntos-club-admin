import { cookies } from 'next/headers';

import type { AppUserWithRelations } from '@/types/app_user';

import { isAdmin } from './roles';

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

  const cookieStore = await cookies();
  const raw = cookieStore.get('active_org_id')?.value;
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const fallback = currentUser?.organization_id
    ? Number(currentUser.organization_id)
    : NaN;
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null;
}
