import PurchaseForm from '@/components/dashboard/purchase/purchase-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreatePurchasePage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseForm />
        </CardContent>
      </Card>
    </div>
  );
}
