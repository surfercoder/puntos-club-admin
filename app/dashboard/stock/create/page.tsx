import { getTranslations } from 'next-intl/server';

import StockForm from '@/components/dashboard/stock/stock-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateStockPage() {
  const t = await getTranslations('Dashboard.stock');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <StockForm />
        </CardContent>
      </Card>
    </div>
  );
}
