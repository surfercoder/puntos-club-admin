import StatusForm from '@/components/dashboard/status/status-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateStatusPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusForm />
        </CardContent>
      </Card>
    </div>
  );
}
