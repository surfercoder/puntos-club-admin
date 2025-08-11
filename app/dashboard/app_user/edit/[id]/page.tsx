import { createClient } from '@/lib/supabase/server';
import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditAppUserPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('app_user').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching user</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserForm appUser={data} />
        </CardContent>
      </Card>
    </div>
  );
}