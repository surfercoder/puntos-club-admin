import AppOrderForm from '@/components/dashboard/app_order/app_order-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateAppOrderPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Order</CardTitle>
        </CardHeader>
        <CardContent>
          <AppOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}