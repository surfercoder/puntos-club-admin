import { cookies } from 'next/headers';

import { belongsToOrg } from './get-active-org-id';
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
 * The cookie is honored only for an org the user actually belongs to. Most
 * tables' RLS is org-blind (`has_admin_portal_access()` checks the role, not
 * the org), so the `.eq('organization_id', …)` each mutation applies is the
 * whole tenant boundary — an unvalidated cookie would let any owner aim a
 * scoped write at another org's rows.
 */
export async function getMutationOrgId(): Promise<number | null> {
  const [cookieStore, currentUser] = await Promise.all([cookies(), getCurrentUser()]);

  const fromUser = currentUser?.organization_id ? Number(currentUser.organization_id) : NaN;
  const fromUserValid = Number.isFinite(fromUser) && fromUser > 0;

  const raw = cookieStore.get('active_org_id')?.value;
  const fromCookie = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(fromCookie) && fromCookie > 0 && currentUser) {
    if (fromCookie === fromUser || (await belongsToOrg(currentUser.id, fromCookie))) {
      return fromCookie;
    }
  }

  return fromUserValid ? fromUser : null;
}
