import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';

export default async function CreateBeneficiaryPage() {
  const [currentUser, t] = await Promise.all([
    getCurrentUser(),
    getTranslations('Dashboard.beneficiary'),
  ]);

  if (!isAdmin(currentUser)) {
    redirect('/dashboard/beneficiary');
  }

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
