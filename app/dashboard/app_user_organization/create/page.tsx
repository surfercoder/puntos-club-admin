import { getTranslations } from 'next-intl/server';

import AppUserOrganizationForm from '@/components/dashboard/app_user_organization/app_user_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateAppUserOrganizationPage() {
  const t = await getTranslations('Dashboard.appUserOrganization');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
