import { getTranslations } from 'next-intl/server';

import SubscriptionForm from '@/components/dashboard/subscription/subscription-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateSubscriptionPage() {
  const t = await getTranslations('CrudPages');
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createSubscription')}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm />
        </CardContent>
      </Card>
    </div>
  );
}
