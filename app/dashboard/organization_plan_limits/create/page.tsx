import { getTranslations } from 'next-intl/server';

import OrganizationPlanLimitForm from '@/components/dashboard/organization_plan_limits/organization-plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateOrganizationPlanLimitPage() {
  const t = await getTranslations('CrudPages');
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createOrganizationPlanLimit')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationPlanLimitForm />
        </CardContent>
      </Card>
    </div>
  );
}
