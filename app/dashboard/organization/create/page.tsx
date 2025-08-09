import OrganizationForm from '@/components/dashboard/organization/organization-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateOrganizationPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
