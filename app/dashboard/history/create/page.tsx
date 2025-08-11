import HistoryForm from '@/components/dashboard/history/history-form';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CreateHistoryPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create History Record</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryForm />
        </CardContent>
      </Card>
    </div>
  );
}