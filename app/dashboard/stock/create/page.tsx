import StockForm from '@/components/dashboard/stock/stock-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateStockPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Stock Record</CardTitle>
        </CardHeader>
        <CardContent>
          <StockForm />
        </CardContent>
      </Card>
    </div>
  );
}