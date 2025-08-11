import UserPermissionForm from '@/components/dashboard/user_permission/user_permission-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateUserPermissionPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create User Permission</CardTitle>
        </CardHeader>
        <CardContent>
          <UserPermissionForm />
        </CardContent>
      </Card>
    </div>
  );
}