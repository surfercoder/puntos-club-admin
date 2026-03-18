import { notFound } from 'next/navigation';

import UserRoleForm from '@/components/dashboard/user_role_crud/user-role-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditUserRolePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('user_role').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleForm userRole={data} />
        </CardContent>
      </Card>
    </div>
  );
}
