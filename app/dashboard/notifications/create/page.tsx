import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import NotificationForm from '@/components/dashboard/notifications/notification-form';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function CreateNotificationPage() {
  const supabasePromise = createClient();
  const userPromise = supabasePromise.then((s) => s.auth.getUser());

  const [supabase, { data: { user } }, t, tCommon] = await Promise.all([
    supabasePromise,
    userPromise,
    getTranslations('Dashboard.notifications'),
    getTranslations('Common'),
  ]);

  const limitsPromise = supabase
    .from('app_user')
    .select('organization_id')
    .eq('auth_user_id', user?.id)
    .single()
    .then(async ({ data: appUser }) => {
      const [{ data: limits }, { data: canSend }] = await Promise.all([
        supabase
          .from('organization_notification_limits')
          .select('*')
          .eq('organization_id', appUser?.organization_id)
          .single(),
        supabase.rpc('can_send_notification', { org_id: appUser?.organization_id }),
      ]);
      return { limits, canSend };
    });

  const { limits, canSend } = await limitsPromise;

  return (
    <PlanLimitGuard features={['push_notifications_monthly']} backHref="/dashboard/notifications">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/notifications">
              <ArrowLeft className="size-4 mr-2" />
              {tCommon('back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{t('createPage.title')}</h1>
            <p className="text-muted-foreground">{t('createPage.description')}</p>
          </div>
        </div>

        <NotificationForm limits={limits} canSend={canSend} />
      </div>
    </PlanLimitGuard>
  );
}
