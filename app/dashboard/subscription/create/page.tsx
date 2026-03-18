import SubscriptionForm from '@/components/dashboard/subscription/subscription-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateSubscriptionPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm />
        </CardContent>
      </Card>
    </div>
  );
}
