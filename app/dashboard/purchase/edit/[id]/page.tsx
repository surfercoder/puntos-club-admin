import { notFound } from 'next/navigation';

import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('purchase').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm purchase={data} />
        </CardContent>
      </Card>
    </div>
  );
}
