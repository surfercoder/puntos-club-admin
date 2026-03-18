import { notFound } from 'next/navigation';

import SubscriptionForm from '@/components/dashboard/subscription/subscription-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('subscription').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm subscription={data} />
        </CardContent>
      </Card>
    </div>
  );
}
