import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { getAllUsers } from '@/actions/dashboard/user/actions';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { UsersList } from '@/components/dashboard/user/users-list';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin, isOwner } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';

export default async function UsersListPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/auth/login');
  }

  const t = await getTranslations('Dashboard.users');

  // Get active organization from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  // Determine which users to show based on role
  let users;
  let pageDescription = '';
  
  if (isAdmin(currentUser)) {
    // Admins see all users
    users = await getAllUsers();
    pageDescription = t('descriptionAdmin');
  } else if (isOwner(currentUser)) {
    // Owners see users from the active organization (from cookie)
    const orgId = activeOrgId || currentUser.organization_id;
    users = await getAllUsers(orgId);
    pageDescription = t('descriptionOwner');
  } else {
    // Other roles shouldn't access this page
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <PlanLimitCreateButton
          features={['cashiers', 'collaborators']}
          createHref="/dashboard/users/create"
          createLabel={t('newButton')}
          disableMode="all"
        />
      </div>

      <PlanUsageBanner features={['cashiers', 'collaborators']} />

      <UsersList 
        initialUsers={users} 
        isOwner={isOwner(currentUser)}
        isAdmin={isAdmin(currentUser)}
      />
    </div>
  );
}
