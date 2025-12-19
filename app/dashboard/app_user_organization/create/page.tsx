import AppUserOrganizationForm from '@/components/dashboard/app_user_organization/app_user_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateAppUserOrganizationPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <AppUserOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
