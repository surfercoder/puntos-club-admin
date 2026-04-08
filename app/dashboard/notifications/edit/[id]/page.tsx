import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import NotificationForm from '@/components/dashboard/notifications/notification-form';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

async function loadData(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: appUser } = await supabase
    .from('app_user')
    .select('organization_id')
    .eq('auth_user_id', user?.id)
    .single();
  const [{ data: notification, error }, { data: limits }, { data: canSend }] = await Promise.all([
    supabase.from('push_notifications').select('*').eq('id', id).single(),
    supabase
      .from('organization_notification_limits')
      .select('*')
      .eq('organization_id', appUser?.organization_id)
      .single(),
    supabase.rpc('can_send_notification', { org_id: appUser?.organization_id }),
  ]);
  return { notification, error, limits, canSend };
}

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const [t, tCommon, { id }] = await Promise.all([
    getTranslations('Dashboard.notifications'),
    getTranslations('Common'),
    params,
  ]);

  const { notification, error, limits, canSend } = await loadData(id);

  if (error || !notification) {
    notFound();
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
