import { getTranslations } from 'next-intl/server';

import AddressForm from '@/components/dashboard/address/address-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateAddressPage() {
  const t = await getTranslations('Dashboard.address');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('createTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <AddressForm />
      </CardContent>
    </Card>
  );
}
