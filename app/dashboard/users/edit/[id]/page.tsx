import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getUserById } from '@/actions/dashboard/user/actions';
import UserForm from '@/components/dashboard/user/user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditUserPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
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
  
  // Fetch organizations
  const { data: organizations, error: orgError } = await supabase
    .from('organization')
    .select('*')
    .order('name');
  
  if (orgError) {
    return <div>Error fetching organizations</div>;
  }
  
  // Fetch roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_role')
    .select('*')
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
              organizations={organizations || []} 
              roles={roles || []} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
