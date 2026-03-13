import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import ProductForm from '@/components/dashboard/product/product-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.product');
  const id = (await params).id;
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) { notFound(); }

  return (
    <div className="w-full max-w-3xl mx-auto">
    <Card>
      <CardHeader>
        <CardTitle>{t('editTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm product={data} />
      </CardContent>
    </Card>
    </div>
  );
}
