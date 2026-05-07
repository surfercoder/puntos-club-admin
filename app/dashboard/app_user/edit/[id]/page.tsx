import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

export default async function EditAppUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, currentUser, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.appUser'),
    getCurrentUser(),
    params,
  ]);
  const currentUserRole = currentUser?.role && typeof currentUser.role === 'object' && 'name' in currentUser.role
    ? (currentUser.role as { name: string }).name
    : undefined;

  const { data, error } = await supabase.from('app_user').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserForm appUser={data} currentUserRole={currentUserRole} />
        </CardContent>
      </Card>
    </div>
  );
}
