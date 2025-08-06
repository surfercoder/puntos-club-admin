import { createClient } from '@/lib/supabase/server';
import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditBeneficiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('beneficiary').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching beneficiary</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Beneficiary</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryForm beneficiary={data} />
        </CardContent>
      </Card>
    </div>
  );
}
