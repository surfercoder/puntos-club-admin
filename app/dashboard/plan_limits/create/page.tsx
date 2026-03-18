import PlanLimitForm from '@/components/dashboard/plan_limits/plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreatePlanLimitPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Plan Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanLimitForm />
        </CardContent>
      </Card>
    </div>
  );
}
