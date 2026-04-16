import { getTranslations } from 'next-intl/server';

import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreatePurchasePage() {
  const t = await getTranslations('Dashboard.purchase');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm />
        </CardContent>
      </Card>
    </div>
  );
}
