import BranchForm from '@/components/dashboard/branch/branch-form';
import BranchFormWithAddress from '@/components/dashboard/branch/branch-form-with-address';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isOwner } from '@/lib/auth/roles';

export default async function CreateBranchPage() {
  const currentUser = await getCurrentUser();
  const isOwnerUser = isOwner(currentUser);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Branch</CardTitle>
      </CardHeader>
      <CardContent>
        {isOwnerUser ? (
          <BranchFormWithAddress />
        ) : (
          <BranchForm />
        )}
      </CardContent>
    </Card>
  );
}
