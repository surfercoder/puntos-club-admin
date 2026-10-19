import { getTranslations } from 'next-intl/server';

import { notFound } from 'next/navigation';

import NotificationCreditsCard from '@/components/dashboard/organization_notification_limits/notification-credits-card';
import OrganizationNotificationLimitForm from '@/components/dashboard/organization_notification_limits/organization_notification_limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function EditOrganizationNotificationLimitPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('CrudPages');
  const supabase = createAdminClient();
  const { id } = await params;

  const [limitResult, organizationsResult] = await Promise.all([
    supabase
      .from('organization_notification_limits')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('organization')
      .select('id, name')
      .order('name', { ascending: true })
  ]);

  if (limitResult.error || !limitResult.data) {
    notFound();
  }

  const { data: credits } = await supabase
    .from('notification_credit')
    .select('id, amount, source, plan, note, created_at')
    .eq('organization_id', limitResult.data.organization_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('editOrganizationNotificationLimit')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationNotificationLimitForm 
            organizationNotificationLimit={limitResult.data}
            organizations={organizationsResult.data ?? []} 
          />
        </CardContent>
      </Card>
      <NotificationCreditsCard
        organizationId={String(limitResult.data.organization_id)}
        granted={limitResult.data.notifications_granted}
        used={limitResult.data.notifications_used}
        credits={credits ?? []}
      />
    </div>
  );
}
