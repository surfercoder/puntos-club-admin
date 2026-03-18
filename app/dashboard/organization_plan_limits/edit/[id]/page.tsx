import { notFound } from 'next/navigation';

import OrganizationPlanLimitForm from '@/components/dashboard/organization_plan_limits/organization-plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditOrganizationPlanLimitPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('organization_plan_limits').select('*').eq('id', id).single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Organization Plan Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationPlanLimitForm organizationPlanLimit={data} />
        </CardContent>
      </Card>
    </div>
  );
}
