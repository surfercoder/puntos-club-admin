import { getTranslations } from 'next-intl/server';

import CategoryForm from '@/components/dashboard/category/category-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateCategoryPage() {
  const t = await getTranslations('Dashboard.category');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>
    </div>
  );
}
