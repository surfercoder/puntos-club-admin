import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function CreateAppUserPage() {
  const [t, currentUser] = await Promise.all([
    getTranslations('Dashboard.appUser'),
    getCurrentUser(),
  ]);
  const currentUserRole = currentUser?.role && typeof currentUser.role === 'object' && 'name' in currentUser.role
    ? (currentUser.role as { name: string }).name
    : undefined;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserForm currentUserRole={currentUserRole} />
        </CardContent>
      </Card>
    </div>
  );
}
