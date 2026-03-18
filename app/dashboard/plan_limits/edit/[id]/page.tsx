import { notFound } from 'next/navigation';

import PlanLimitForm from '@/components/dashboard/plan_limits/plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditPlanLimitPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('plan_limits').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Plan Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanLimitForm planLimit={data} />
        </CardContent>
      </Card>
    </div>
  );
}
