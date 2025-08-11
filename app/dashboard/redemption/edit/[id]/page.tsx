import { createClient } from '@/lib/supabase/server';
import RedemptionForm from '@/components/dashboard/redemption/redemption-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditRedemptionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('redemption').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching redemption</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Redemption</CardTitle>
        </CardHeader>
        <CardContent>
          <RedemptionForm redemption={data} />
        </CardContent>
      </Card>
    </div>
  );
}