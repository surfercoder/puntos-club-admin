import { notFound } from 'next/navigation';

import HistoryForm from '@/components/dashboard/history/history-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('history').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching history record</div>;
  }

  if (!data) {notFound();}

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit History Record</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryForm history={data} />
        </CardContent>
      </Card>
    </div>
  );
}