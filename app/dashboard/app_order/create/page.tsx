import { getTranslations } from 'next-intl/server';

import AppOrderForm from '@/components/dashboard/app_order/app_order-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateAppOrderPage() {
  const t = await getTranslations('Dashboard.appOrder');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AppOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
