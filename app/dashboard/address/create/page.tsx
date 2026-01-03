import AddressForm from '@/components/dashboard/address/address-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateAddressPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Address</CardTitle>
      </CardHeader>
      <CardContent>
        <AddressForm />
      </CardContent>
    </Card>
  );
}
