import BeneficiaryForm from '@/components/dashboard/beneficiary/beneficiary-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateBeneficiaryPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Beneficiary</CardTitle>
        </CardHeader>
        <CardContent>
          <BeneficiaryForm />
        </CardContent>
      </Card>
    </div>
  );
}
