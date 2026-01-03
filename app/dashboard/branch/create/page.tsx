import BranchForm from '@/components/dashboard/branch/branch-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateBranchPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Branch</CardTitle>
      </CardHeader>
      <CardContent>
        <BranchForm />
      </CardContent>
    </Card>
  );
}
