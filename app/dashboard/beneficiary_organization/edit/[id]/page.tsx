import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BeneficiaryOrganizationForm from '@/components/dashboard/beneficiary_organization/beneficiary_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditBeneficiaryOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.beneficiaryOrganization');
  const id = (await params).id;

  const { data, error } = await supabase
    .from('beneficiary_organization')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryOrganizationForm beneficiaryOrganization={data} />
        </CardContent>
      </Card>
    </div>
  );
}
