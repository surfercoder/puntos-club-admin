import OrganizationPlanLimitForm from '@/components/dashboard/organization_plan_limits/organization-plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateOrganizationPlanLimitPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization Plan Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationPlanLimitForm />
        </CardContent>
      </Card>
    </div>
  );
}
