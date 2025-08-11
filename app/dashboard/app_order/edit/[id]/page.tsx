import { createClient } from '@/lib/supabase/server';
import AppOrderForm from '@/components/dashboard/app_order/app_order-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditAppOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('app_order').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching order</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Order</CardTitle>
        </CardHeader>
        <CardContent>
          <AppOrderForm appOrder={data} />
        </CardContent>
      </Card>
    </div>
  );
}