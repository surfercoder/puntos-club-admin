import { notFound } from 'next/navigation';

import AssignmentForm from '@/components/dashboard/assignment/assignment-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('assignment').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching assignment</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentForm assignment={data} />
        </CardContent>
      </Card>
    </div>
  );
}
