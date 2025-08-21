import AssignmentForm from '@/components/dashboard/assignment/assignment-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateAssignmentPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
