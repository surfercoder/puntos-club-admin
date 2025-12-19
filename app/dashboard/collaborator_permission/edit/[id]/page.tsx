import { notFound } from 'next/navigation';

import CollaboratorPermissionForm from '@/components/dashboard/collaborator_permission/collaborator_permission-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditCollaboratorPermissionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;

  const { data, error } = await supabase
    .from('collaborator_permission')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return <div>Error fetching collaborator permission</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Collaborator Permission</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorPermissionForm collaboratorPermission={data} />
        </CardContent>
      </Card>
    </div>
  );
}
