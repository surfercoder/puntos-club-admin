import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateAppUserPage() {
  const t = await getTranslations('Dashboard.appUser');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserForm />
        </CardContent>
      </Card>
    </div>
  );
}
