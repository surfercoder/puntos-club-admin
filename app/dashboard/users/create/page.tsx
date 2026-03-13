import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import UserForm from '@/components/dashboard/user/user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin, isOwner, getAssignableRoles } from '@/lib/auth/roles';

export default async function CreateUserPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/auth/login');
  }

  const t = await getTranslations('Dashboard.users');
  const tBreadcrumb = await getTranslations('Breadcrumb');

  // Only admins and owners can create users
  if (!isAdmin(currentUser) && !isOwner(currentUser)) {
    redirect('/dashboard');
  }

  // Get active organization from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  // Fetch organizations based on role
  let organizations;
  let defaultOrgId: string | undefined;

  if (isAdmin(currentUser)) {
    // Admins can see all organizations
    const { data: orgsData, error: orgError } = await supabase
      .from('organization')
      .select('*')
      .order('name');

    if (orgError) {
      return <div>{t('fetchErrorOrgs')}</div>;
    }
    organizations = orgsData || [];
    // Use active org from cookie if available
    defaultOrgId = activeOrgId;
  } else if (isOwner(currentUser)) {
    // Owners see all their organizations from app_user_organization
    const { data: membershipsData } = await supabase
      .from('app_user_organization')
      .select('organization:organization_id(id, name)')
      .eq('app_user_id', currentUser.id)
      .eq('is_active', true);

    const orgs = (membershipsData ?? [])
      .map((m) => {
        const org = Array.isArray(m.organization) ? m.organization[0] : m.organization;
        return org;
      })
      .filter((o): o is { id: string; name: string } => Boolean(o && o.id && o.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    organizations = orgs;
    // Use active org from cookie, or fall back to user's primary organization
    defaultOrgId = activeOrgId || currentUser.organization_id;
  } else {
    organizations = [];
  }

  // Fetch roles based on permissions
  const assignableRoleNames = getAssignableRoles(currentUser);
  const { data: allRoles, error: rolesError } = await supabase
    .from('user_role')
    .select('*')
    .in('name', assignableRoleNames)
    .order('name');

  if (rolesError) {
    return <div>{t('fetchErrorRoles')}</div>;
  }

  return (
    <PlanLimitGuard features={['cashiers', 'collaborators']} backHref="/dashboard/users" mode="all">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link className="text-sm font-medium text-muted-foreground hover:text-foreground" href="/dashboard">
                {tBreadcrumb('panel')}
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-muted-foreground">/</span>
                <Link className="text-sm font-medium text-muted-foreground hover:text-foreground" href="/dashboard/users">
                  {tBreadcrumb('users')}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-muted-foreground">/</span>
                <span className="text-sm font-medium text-foreground">{tBreadcrumb('new')}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t('createTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm
                organizations={organizations}
                roles={allRoles || []}
                currentUser={currentUser}
                defaultOrgId={defaultOrgId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PlanLimitGuard>
  );
}
