import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import CategoryForm from '@/components/dashboard/category/category-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.category');
  const id = (await params).id;
  const { data, error } = await supabase.from('category').select('*').eq('id', id).single();

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
          <CategoryForm category={data} />
        </CardContent>
      </Card>
    </div>
  );
}
