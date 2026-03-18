import UserRoleForm from '@/components/dashboard/user_role_crud/user-role-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function CreateUserRolePage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create User Role</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleForm />
        </CardContent>
      </Card>
    </div>
  );
}
