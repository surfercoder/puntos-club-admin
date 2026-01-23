import OrganizationNotificationLimitForm from '@/components/dashboard/organization_notification_limits/organization_notification_limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function CreateOrganizationNotificationLimitPage() {
  const supabase = await createClient();
  const { data: organizations } = await supabase
    .from('organization')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organization Notification Limit</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationNotificationLimitForm organizations={organizations ?? []} />
      </CardContent>
    </Card>
  );
}
