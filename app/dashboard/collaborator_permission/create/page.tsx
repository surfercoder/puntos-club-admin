import CollaboratorPermissionForm from '@/components/dashboard/collaborator_permission/collaborator_permission-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateCollaboratorPermissionPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Collaborator Permission</CardTitle>
        </CardHeader>
        <CardContent>
          <CollaboratorPermissionForm />
        </CardContent>
      </Card>
    </div>
  );
}
