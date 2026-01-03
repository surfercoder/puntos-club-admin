import Link from 'next/link';
import { cookies } from 'next/headers';

import { getAllUsers } from '@/actions/dashboard/user/actions';
import { UsersList } from '@/components/dashboard/user/users-list';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin, isOwner } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';

export default async function UsersListPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Get active organization from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;

  // Determine which users to show based on role
  let users;
  let pageDescription = '';
  
  if (isAdmin(currentUser)) {
    // Admins see all users
    users = await getAllUsers();
    pageDescription = 'Manage all users in your system (owners, collaborators, cashiers, and beneficiaries)';
  } else if (isOwner(currentUser)) {
    // Owners see users from the active organization (from cookie)
    const orgId = activeOrgId || currentUser.organization_id;
    users = await getAllUsers(orgId);
    pageDescription = 'Manage users in your organization (collaborators and cashiers)';
  } else {
    // Other roles shouldn't access this page
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/create">+ New User</Link>
        </Button>
      </div>

      <UsersList 
        initialUsers={users} 
        isOwner={isOwner(currentUser)}
      />
    </div>
  );
}
