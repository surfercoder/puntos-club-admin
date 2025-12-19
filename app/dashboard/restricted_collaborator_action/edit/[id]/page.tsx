import { notFound } from 'next/navigation';

import RestrictedCollaboratorActionForm from '@/components/dashboard/restricted_collaborator_action/restricted_collaborator_action-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditRestrictedCollaboratorActionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;

  const { data, error } = await supabase
    .from('restricted_collaborator_action')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return <div>Error fetching restricted action</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Restricted Action</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictedCollaboratorActionForm restrictedAction={data} />
        </CardContent>
      </Card>
    </div>
  );
}
