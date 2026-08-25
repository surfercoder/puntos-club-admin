import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import ProductForm from '@/components/dashboard/product/product-form';
import { createClient } from '@/lib/supabase/server';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.product'),
    params,
  ]);
  const { data, error } = await supabase.from('product').select('*').eq('id', id).single();

  if (error) {
    return <div>{t('fetchError')}</div>;
  }

  if (!data) { notFound(); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('editTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('editDescription')}</p>
      </div>
      <ProductForm product={data} />
    </div>
  );
}
