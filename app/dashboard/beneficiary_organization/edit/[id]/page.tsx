import { notFound } from 'next/navigation';

import BeneficiaryOrganizationForm from '@/components/dashboard/beneficiary_organization/beneficiary_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditBeneficiaryOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;

  const { data, error } = await supabase
    .from('beneficiary_organization')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return <div>Error fetching membership</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryOrganizationForm beneficiaryOrganization={data} />
        </CardContent>
      </Card>
    </div>
  );
}
