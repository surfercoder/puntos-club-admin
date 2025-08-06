import BranchForm from '@/components/dashboard/branch/branch-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateBranchPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchForm />
        </CardContent>
      </Card>
    </div>
  );
}
