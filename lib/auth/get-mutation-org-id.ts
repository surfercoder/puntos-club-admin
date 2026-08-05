import { cookies } from 'next/headers';

import { getCurrentUser } from './get-current-user';

/**
 * Resolves the organization id a mutating action should write to.
 *
 * Reads the `active_org_id` cookie, falling back to the user's own
 * `organization_id`. The fallback matters: the cookie is only written by the
 * client org switcher (`/api/active-org`), so a user who just logged in and
 * never switched orgs has no cookie at all — and every create/update/delete
 * used to fail with "Missing active organization".
 *
 * Mirrors `getActiveOrgIdFilter`, except that returns null for admins to give
 * them a cross-org *read*; a write needs one concrete org, so admins resolve
 * the same way as everyone else here.
 *
 * ponytail: no membership validation on the cookie — RLS plus the
 * `.eq('organization_id', …)` on each mutation already stop a forged cookie
 * from touching another org's rows. Validate here only if a write ever lands
 * somewhere those two don't cover.
 */
export async function getMutationOrgId(): Promise<number | null> {
  const [cookieStore, currentUser] = await Promise.all([cookies(), getCurrentUser()]);

  const raw = cookieStore.get('active_org_id')?.value;
  const fromCookie = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(fromCookie) && fromCookie > 0) {
    return fromCookie;
  }

  const fromUser = currentUser?.organization_id ? Number(currentUser.organization_id) : NaN;
  return Number.isFinite(fromUser) && fromUser > 0 ? fromUser : null;
}
