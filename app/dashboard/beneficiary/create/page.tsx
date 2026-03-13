import { getTranslations } from 'next-intl/server';

import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateBeneficiaryPage() {
  const t = await getTranslations('Dashboard.beneficiary');

  return (
    <PlanLimitGuard features={['beneficiaries']} backHref="/dashboard/beneficiary">
      <div className="w-full max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('createTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <BeneficiaryForm />
          </CardContent>
        </Card>
      </div>
    </PlanLimitGuard>
  );
}
