import { getTranslations } from 'next-intl/server';

import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import ProductForm from '@/components/dashboard/product/product-form';

export default async function CreateProductPage() {
  const t = await getTranslations('Dashboard.product');

  return (
    <PlanLimitGuard features={['redeemable_products']} backHref="/dashboard/product">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('createDescription')}</p>
        </div>
        <ProductForm />
      </div>
    </PlanLimitGuard>
  );
}
