import { notFound } from 'next/navigation';

import PushTokenForm from '@/components/dashboard/push_tokens_crud/push-token-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditPushTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('push_tokens').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Push Token</CardTitle>
        </CardHeader>
        <CardContent>
          <PushTokenForm pushToken={data} />
        </CardContent>
      </Card>
    </div>
  );
}
