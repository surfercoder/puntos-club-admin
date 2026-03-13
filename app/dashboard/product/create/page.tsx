import { getTranslations } from 'next-intl/server';

import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import ProductForm from '@/components/dashboard/product/product-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateProductPage() {
  const t = await getTranslations('Dashboard.product');

  return (
    <PlanLimitGuard features={['redeemable_products']} backHref="/dashboard/product">
      <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
      </div>
    </PlanLimitGuard>
  );
}
