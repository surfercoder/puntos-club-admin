import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import RedemptionForm from '@/components/dashboard/redemption/redemption-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditRedemptionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.redemption');
  const id = (await params).id;
  const { data, error } = await supabase.from('redemption').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) {notFound();}

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RedemptionForm redemption={data} />
        </CardContent>
      </Card>
    </div>
  );
}
