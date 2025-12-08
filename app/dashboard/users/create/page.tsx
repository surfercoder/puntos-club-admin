import Link from 'next/link';

import UserForm from '@/components/dashboard/user/user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function CreateUserPage() {
  const supabase = await createClient();
  
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
              <span className="text-sm font-medium text-gray-900">Create</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm organizations={organizations || []} roles={roles || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
