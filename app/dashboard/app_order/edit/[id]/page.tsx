import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import AppOrderForm from '@/components/dashboard/app_order/app_order-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditAppOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.appOrder');
  const id = (await params).id;
  const { data, error } = await supabase.from('app_order').select('*').eq('id', id).single();

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
          <AppOrderForm appOrder={data} />
        </CardContent>
      </Card>
    </div>
  );
}
