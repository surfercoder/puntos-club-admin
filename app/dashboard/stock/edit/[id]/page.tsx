import { createClient } from '@/lib/supabase/server';
import StockForm from '@/components/dashboard/stock/stock-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('stock').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching stock record</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Stock Record</CardTitle>
        </CardHeader>
        <CardContent>
          <StockForm stock={data} />
        </CardContent>
      </Card>
    </div>
  );
}