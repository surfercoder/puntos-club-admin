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
import { createClient } from '@/lib/supabase/server';

export default async function PushNotificationRecipientsListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('push_notification_recipients')
    .select('*, push_notification:push_notification_id(title), beneficiary:beneficiary_id(first_name, last_name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error fetching push notification recipients</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Push Notification Recipients</h1>
          <p className="text-muted-foreground">Track delivery status of push notifications</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/push_notification_recipients/create">+ New Recipient</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notification</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Read At</TableHead>
              <TableHead>Error</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(recipient.push_notification)
                      ? recipient.push_notification[0]?.title
                      : recipient.push_notification?.title || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(recipient.beneficiary) 
                      ? `${recipient.beneficiary[0]?.first_name || ''} ${recipient.beneficiary[0]?.last_name || ''}`.trim() || recipient.beneficiary[0]?.email
                      : `${recipient.beneficiary?.first_name || ''} ${recipient.beneficiary?.last_name || ''}`.trim() || recipient.beneficiary?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      recipient.status === 'sent' ? 'bg-green-100 text-green-800' :
                      recipient.status === 'read' ? 'bg-blue-100 text-blue-800' :
                      recipient.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {recipient.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {recipient.read_at ? new Date(recipient.read_at).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {recipient.error_message || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/push_notification_recipients/${recipient.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No recipients found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
