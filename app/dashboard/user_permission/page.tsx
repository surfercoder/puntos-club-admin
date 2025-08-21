import { Pencil } from 'lucide-react';
import Link from 'next/link';

import DeleteModal from '@/components/dashboard/user_permission/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

interface UserPermissionWithRelations {
  id: string;
  user_id: string;
  branch_id: string;
  action: string;
  assignment_date: string;
  app_user: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  branch: {
    name: string;
  };
}

export default async function UserPermissionListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_permission')
    .select(`
      *,
      app_user:app_user(first_name, last_name, email),
      branch:branch(name)
    `)
    .order('assignment_date', { ascending: false });

  if (error) {
    return <div>Error fetching user permissions</div>;
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
              <span className="text-sm font-medium text-gray-900">User Permissions</span>
            </div>
          </li>
        </ol>
      </nav>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Permissions</h1>
          <p className="text-muted-foreground">Manage user permissions in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/user_permission/create">+ New User Permission</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Assignment Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((userPermission: UserPermissionWithRelations) => (
                <TableRow key={userPermission.id}>
                  <TableCell className="font-medium">
                    {userPermission.app_user?.first_name || userPermission.app_user?.last_name 
                      ? `${userPermission.app_user.first_name || ''} ${userPermission.app_user.last_name || ''}`.trim()
                      : userPermission.app_user?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{userPermission.branch?.name || 'N/A'}</TableCell>
                  <TableCell>{userPermission.action}</TableCell>
                  <TableCell>
                    {new Date(userPermission.assignment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/user_permission/edit/${userPermission.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        userPermissionDescription={`${userPermission.action} - ${userPermission.branch?.name || 'Branch'}`}
                        userPermissionId={userPermission.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>No user permissions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}