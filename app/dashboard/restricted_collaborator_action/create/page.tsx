import RestrictedCollaboratorActionForm from '@/components/dashboard/restricted_collaborator_action/restricted_collaborator_action-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateRestrictedCollaboratorActionPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Restricted Action</CardTitle>
        </CardHeader>
        <CardContent>
          <RestrictedCollaboratorActionForm />
        </CardContent>
      </Card>
    </div>
  );
}
