import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import AppUserOrganizationForm from '@/components/dashboard/app_user_organization/app_user_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditAppUserOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.appUserOrganization'),
    params,
  ]);

  const { data, error } = await supabase
    .from('app_user_organization')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserOrganizationForm appUserOrganization={data} />
        </CardContent>
      </Card>
    </div>
  );
}
