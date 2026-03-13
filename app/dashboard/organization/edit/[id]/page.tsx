import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import OrganizationForm from '@/components/dashboard/organization/organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.organization');
  const id = (await params).id;
  const { data, error } = await supabase.from('organization').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) { notFound(); }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationForm organization={data} />
      </CardContent>
    </Card>
  );
}
