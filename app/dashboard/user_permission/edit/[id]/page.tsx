import { notFound } from 'next/navigation';

import UserPermissionForm from '@/components/dashboard/user_permission/user_permission-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditUserPermissionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('user_permission').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching user permission</div>;
  }

  if (!data) {notFound();}

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit User Permission</CardTitle>
        </CardHeader>
        <CardContent>
          <UserPermissionForm userPermission={data} />
        </CardContent>
      </Card>
    </div>
  );
}