import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.purchase'),
    params,
  ]);
  const { data, error } = await supabase.from('purchase').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm purchase={data} />
        </CardContent>
      </Card>
    </div>
  );
}
