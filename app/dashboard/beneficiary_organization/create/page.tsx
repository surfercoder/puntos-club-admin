import BeneficiaryOrganizationForm from '@/components/dashboard/beneficiary_organization/beneficiary_organization-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateBeneficiaryOrganizationPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Membership</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
