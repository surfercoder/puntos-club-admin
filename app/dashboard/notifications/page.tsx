import { Bell, Send } from 'lucide-react';
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
import { createClient } from '@/lib/supabase/server';
import type { PushNotification } from '@/types/push_notification';

export default async function NotificationsPage() {
  const supabase = await createClient();
  
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
    console.error('Error fetching notifications:', error);
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sending: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Push Notifications
          </h1>
          <p className="text-muted-foreground">
            Send notifications to your beneficiaries
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notifications/create">
            <Send className="h-4 w-4 mr-2" />
            New Notification
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(notification.status)}`}>
                      {notification.status}
                    </span>
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
                    <p className="text-muted-foreground">No notifications sent yet</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/notifications/create">
                        Send your first notification
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
