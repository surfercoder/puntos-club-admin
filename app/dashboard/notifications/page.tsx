import { Bell, Send } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';
import type { PushNotification } from '@/types/push_notification';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.notifications');
  const tCommon = await getTranslations('Common');

  const { data: notifications, error } = await supabase
    .from('push_notifications')
    .select(`
      *,
      creator:app_user!push_notifications_created_by_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch notifications');
  }

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      sent: 'default',
      sending: 'outline',
      draft: 'secondary',
      failed: 'destructive',
    };
    return variants[status] ?? 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notifications/create">
            <Send className="h-4 w-4 mr-2" />
            {t('newButton')}
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.message')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.sent')}</TableHead>
              <TableHead>{t('tableHeaders.failed')}</TableHead>
              <TableHead>{tCommon('createdBy')}</TableHead>
              <TableHead>{tCommon('createdAt')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications && notifications.length > 0 ? (
              notifications.map((notification: PushNotification & { creator?: { first_name?: string; last_name?: string; email?: string } }) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {notification.title}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {notification.body}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{notification.sent_count}</TableCell>
                  <TableCell>{notification.failed_count}</TableCell>
                  <TableCell>
                    {notification.creator
                      ? `${notification.creator.first_name || ''} ${notification.creator.last_name || ''}`.trim() || notification.creator.email
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(notification.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={7}>
                  <div className="flex flex-col items-center gap-2">
                    <Bell className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('empty')}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/notifications/create">
                        {t('emptyAction')}
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
