import { notFound } from 'next/navigation';

import BranchForm from '@/components/dashboard/branch/branch-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('branch').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching branch</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm branch={data} />
        </CardContent>
      </Card>
    </div>
  );
}
