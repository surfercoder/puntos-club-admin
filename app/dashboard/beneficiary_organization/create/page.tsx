import { getTranslations } from 'next-intl/server';

import BeneficiaryOrganizationForm from '@/components/dashboard/beneficiary_organization/beneficiary_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateBeneficiaryOrganizationPage() {
  const t = await getTranslations('Dashboard.beneficiaryOrganization');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
