import { cookies } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import NotificationForm from '@/components/dashboard/notifications/notification-form';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { Button } from '@/components/ui/button';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';

export default async function AdminCreateNotificationPage() {
  const currentUser = await getCurrentUser();

  if (!isAdmin(currentUser)) {
    redirect('/dashboard/notifications/create');
  }

  const [t, tCommon, cookieStore] = await Promise.all([
    getTranslations('Dashboard.pushNotifications'),
    getTranslations('Common'),
    cookies(),
  ]);
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const supabase = createAdminClient();

  let limits = null;
  let canSend: boolean | null = null;

  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    const { data: limitsData } = await supabase
      .from('organization_notification_limits')
      .select('*')
      .eq('organization_id', activeOrgIdNumber)
      .single();

    limits = limitsData;

    const { data: canSendData } = await supabase.rpc('can_send_notification', {
      org_id: activeOrgIdNumber,
    });

    canSend = canSendData;
  }

  return (
    <PlanLimitGuard features={['push_notifications_monthly']} backHref="/dashboard/push_notifications">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/push_notifications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon('back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('createTitle')}</h1>
            <p className="text-muted-foreground">
              {t('createDescription')}
            </p>
          </div>
        </div>

        <NotificationForm
          limits={limits}
          canSend={canSend}
          organizationId={activeOrgIdNumber}
          redirectPath="/dashboard/push_notifications"
        />
      </div>
    </PlanLimitGuard>
  );
}
