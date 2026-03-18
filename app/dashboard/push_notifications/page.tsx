import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/push_notifications_crud/delete-modal';
import ToastHandler from '@/components/dashboard/push_notifications_crud/toast-handler';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PushNotificationsListPage() {
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const t = await getTranslations('Dashboard.pushNotifications');

  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let query = supabase
    .from('push_notifications')
    .select('*, organization:organization_id(name), creator:created_by(first_name, last_name)')
    .order('created_at', { ascending: false });

  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <ToastHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t('title')}
            <PlanUsageBadge feature="push_notifications_monthly" />
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <PlanLimitCreateButton
          features={['push_notifications_monthly']}
          createHref="/dashboard/push_notifications/create"
          createLabel={t('newButton')}
        />
      </div>

      <PlanUsageBanner features={['push_notifications_monthly']} />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.sent')}</TableHead>
              <TableHead>{t('tableHeaders.failed')}</TableHead>
              <TableHead>{t('tableHeaders.createdAt')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
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
                    <Badge variant={
                      notification.status === 'sent' ? 'default' :
                      notification.status === 'sending' ? 'outline' :
                      notification.status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{notification.sent_count}</TableCell>
                  <TableCell>{notification.failed_count}</TableCell>
                  <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/push_notifications/edit/${notification.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        notificationId={String(notification.id)}
                        notificationTitle={notification.title}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
