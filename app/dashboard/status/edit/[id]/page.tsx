import { createClient } from '@/lib/supabase/server';
import StatusForm from '@/components/dashboard/status/status-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('status').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching status</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusForm status={data} />
        </CardContent>
      </Card>
    </div>
  );
}
