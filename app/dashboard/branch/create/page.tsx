import { getTranslations } from 'next-intl/server';

import BranchForm from '@/components/dashboard/branch/branch-form';
import BranchFormWithAddress from '@/components/dashboard/branch/branch-form-with-address';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isOwner } from '@/lib/auth/roles';

export default async function CreateBranchPage() {
  const currentUser = await getCurrentUser();
  const isOwnerUser = isOwner(currentUser);
  const t = await getTranslations('Dashboard.branch');

  return (
    <PlanLimitGuard features={['branches']} backHref="/dashboard/branch">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isOwnerUser ? (
            <BranchFormWithAddress />
          ) : (
            <BranchForm />
          )}
        </CardContent>
      </Card>
    </PlanLimitGuard>
  );
}
