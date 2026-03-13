import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import BranchForm from '@/components/dashboard/branch/branch-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditBranchPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.branch');
  const id = (await params).id;
  const { data, error } = await supabase.from('branch').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <BranchForm branch={data} />
      </CardContent>
    </Card>
  );
}
