import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import NotificationForm from '@/components/dashboard/notifications/notification-form';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function CreateNotificationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: appUser } = await supabase
    .from('app_user')
    .select('organization_id')
    .eq('auth_user_id', user?.id)
    .single();

  const { data: limits } = await supabase
    .from('organization_notification_limits')
    .select('*')
    .eq('organization_id', appUser?.organization_id)
    .single();

  const { data: canSend } = await supabase.rpc('can_send_notification', {
    org_id: appUser?.organization_id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/notifications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Push Notification</h1>
          <p className="text-muted-foreground">
            Send a notification to all your active beneficiaries
          </p>
        </div>
      </div>

      <NotificationForm limits={limits} canSend={canSend} />
    </div>
  );
}
