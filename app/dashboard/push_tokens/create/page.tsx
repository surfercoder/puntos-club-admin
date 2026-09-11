import { getTranslations } from 'next-intl/server';

import PushTokenForm from '@/components/dashboard/push_tokens_crud/push-token-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreatePushTokenPage() {
  const t = await getTranslations('CrudPages');
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('createPushToken')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PushTokenForm />
        </CardContent>
      </Card>
    </div>
  );
}
