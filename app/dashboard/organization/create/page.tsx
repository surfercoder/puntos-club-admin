import { getTranslations } from 'next-intl/server';

import OrganizationForm from '@/components/dashboard/organization/organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateOrganizationPage() {
  const t = await getTranslations('Dashboard.organization');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationForm />
      </CardContent>
    </Card>
  );
}
