import { getTranslations } from 'next-intl/server';

import RedemptionForm from '@/components/dashboard/redemption/redemption-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateRedemptionPage() {
  const t = await getTranslations('Dashboard.redemption');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RedemptionForm />
        </CardContent>
      </Card>
    </div>
  );
}
