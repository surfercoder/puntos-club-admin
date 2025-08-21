import RedemptionForm from '@/components/dashboard/redemption/redemption-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateRedemptionPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Redemption</CardTitle>
        </CardHeader>
        <CardContent>
          <RedemptionForm />
        </CardContent>
      </Card>
    </div>
  );
}