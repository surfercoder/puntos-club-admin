import { notFound } from 'next/navigation';

import PushNotificationEditForm from '@/components/dashboard/push_notifications_crud/push-notification-edit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditPushNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('push_notifications').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Push Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <PushNotificationEditForm notification={data} />
        </CardContent>
      </Card>
    </div>
  );
}
