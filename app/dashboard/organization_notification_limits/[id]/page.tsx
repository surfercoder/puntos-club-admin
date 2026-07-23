import { notFound } from 'next/navigation';

import OrganizationNotificationLimitForm from '@/components/dashboard/organization_notification_limits/organization_notification_limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function EditOrganizationNotificationLimitPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Organization Notification Limit</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationNotificationLimitForm 
          organizationNotificationLimit={limitResult.data}
          organizations={organizationsResult.data ?? []} 
        />
      </CardContent>
    </Card>
  );
}
