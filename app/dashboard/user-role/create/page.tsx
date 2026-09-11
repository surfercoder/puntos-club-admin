import { getTranslations } from 'next-intl/server';

import UserRoleForm from '@/components/dashboard/user_role_crud/user-role-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateUserRolePage() {
  const t = await getTranslations('CrudPages');
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createUserRole')}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleForm />
        </CardContent>
      </Card>
    </div>
  );
}
