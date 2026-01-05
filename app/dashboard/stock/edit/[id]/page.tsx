import { notFound } from 'next/navigation';

import StockForm from '@/components/dashboard/stock/stock-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('stock').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching stock record</div>;
  }

  if (!data) { notFound(); }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Stock Record</CardTitle>
      </CardHeader>
      <CardContent>
        <StockForm stock={data} />
      </CardContent>
    </Card>
  );
}