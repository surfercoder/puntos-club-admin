import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import NotificationForm from '@/components/dashboard/notifications/notification-form';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, tCommon, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.notifications'),
    getTranslations('Common'),
    params,
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: notification, error } = await supabase
    .from('push_notifications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !notification) {
    notFound();
  }

  const { data: appUser } = await supabase
    .from('app_user')
    .select('organization_id')
    .eq('auth_user_id', user.id)
    .single();

  let limits = null;
  let canSend = null;

  if (appUser?.organization_id) {
    const [limitsResult, canSendResult] = await Promise.all([
      supabase
        .from('organization_notification_limits')
        .select('*')
        .eq('organization_id', appUser.organization_id)
        .single(),
      supabase.rpc('can_send_notification', {
        org_id: appUser.organization_id,
      }),
    ]);

    if (limitsResult.error && limitsResult.error.code !== 'PGRST116') {
      throw new Error(
        `Failed to fetch organization_notification_limits for organization ${appUser.organization_id}: ${limitsResult.error.message}`,
      );
    }
    if (canSendResult.error) {
      throw new Error(
        `Failed to call can_send_notification for organization ${appUser.organization_id}: ${canSendResult.error.message}`,
      );
    }

    limits = limitsResult.data;
    canSend = canSendResult.data;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/notifications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('editPage.title')}</h1>
          <p className="text-muted-foreground">{t('editPage.description')}</p>
        </div>
      </div>

      <NotificationForm
        limits={limits}
        canSend={canSend}
        notification={notification}
      />
    </div>
  );
}
