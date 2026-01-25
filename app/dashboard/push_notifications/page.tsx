import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PushNotificationsListPage() {
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  // Use admin client to bypass RLS for admin users
  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let query = supabase
    .from('push_notifications')
    .select('*, organization:organization_id(name), creator:created_by(first_name, last_name)')
    .order('created_at', { ascending: false });

  // Only filter by organization for non-admin users
  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  if (error) {
    return <div>Error fetching push notifications</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Push Notifications</h1>
          <p className="text-muted-foreground">Manage push notifications sent to beneficiaries</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/push_notifications/create">+ New Push Notification</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent Count</TableHead>
              <TableHead>Failed Count</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell>
                    {Array.isArray(notification.organization) 
                      ? notification.organization[0]?.name 
                      : notification.organization?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                      notification.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                      notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.status}
                    </span>
                  </TableCell>
                  <TableCell>{notification.sent_count}</TableCell>
                  <TableCell>{notification.failed_count}</TableCell>
                  <TableCell>
                    {new Date(notification.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/push_notifications/${notification.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No push notifications found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
