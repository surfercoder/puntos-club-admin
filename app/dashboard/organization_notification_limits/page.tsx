import { Pencil } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function OrganizationNotificationLimitsListPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('organization_notification_limits')
    .select('*, organization:organization_id(name)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error fetching organization notification limits</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organization Notification Limits</h1>
          <p className="text-muted-foreground">Manage notification limits and plans for organizations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/organization_notification_limits/create">+ New Limit</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan Type</TableHead>
              <TableHead>Daily Limit</TableHead>
              <TableHead>Monthly Limit</TableHead>
              <TableHead>Min Hours Between</TableHead>
              <TableHead>Sent Today</TableHead>
              <TableHead>Sent This Month</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(limit.organization)
                      ? limit.organization[0]?.name
                      : limit.organization?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      limit.plan_type === 'premium' ? 'bg-purple-100 text-purple-800' :
                      limit.plan_type === 'pro' ? 'bg-blue-100 text-blue-800' :
                      limit.plan_type === 'light' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {limit.plan_type}
                    </span>
                  </TableCell>
                  <TableCell>{limit.daily_limit}</TableCell>
                  <TableCell>{limit.monthly_limit}</TableCell>
                  <TableCell>{limit.min_hours_between_notifications}h</TableCell>
                  <TableCell>{limit.notifications_sent_today}</TableCell>
                  <TableCell>{limit.notifications_sent_this_month}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/organization_notification_limits/${limit.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={8}>No notification limits found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
