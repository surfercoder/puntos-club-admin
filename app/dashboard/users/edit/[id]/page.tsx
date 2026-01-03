import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { getUserById } from '@/actions/dashboard/user/actions';
import UserForm from '@/components/dashboard/user/user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin, isOwner, getAssignableRoles } from '@/lib/auth/roles';

export default async function EditUserPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/auth/login');
  }

  // Only admins and owners can edit users
  if (!isAdmin(currentUser) && !isOwner(currentUser)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const { type } = await searchParams;
  
  const userType = (type === 'beneficiary' ? 'beneficiary' : 'app_user') as 'app_user' | 'beneficiary';
  
  // Fetch the user
  let user;
  try {
    user = await getUserById(id, userType);
  } catch {
    notFound();
  }
  
  if (!user) {
    notFound();
  }

  // Owners can only edit users from their organization
  if (isOwner(currentUser) && user.organization_id !== currentUser.organization_id) {
    redirect('/dashboard/users');
  }

  // Get active organization from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  
  // Fetch organizations based on role
  let organizations;
  if (isAdmin(currentUser)) {
    const { data: orgsData, error: orgError } = await supabase
      .from('organization')
      .select('*')
      .order('name');
    
    if (orgError) {
      return <div>Error fetching organizations</div>;
    }
    organizations = orgsData || [];
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
    return <div>Error fetching roles</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link className="text-sm font-medium text-gray-500 hover:text-blue-600" href="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <Link className="text-sm font-medium text-gray-500 hover:text-blue-600" href="/dashboard/users">
                Users
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">Edit</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm 
              user={user} 
              organizations={organizations} 
              roles={allRoles || []} 
              currentUser={currentUser}
              defaultOrgId={activeOrgId}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
