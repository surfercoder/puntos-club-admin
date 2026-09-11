import { getTranslations } from 'next-intl/server';

import { notFound } from 'next/navigation';

import OrganizationPlanLimitForm from '@/components/dashboard/organization_plan_limits/organization-plan-limit-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditOrganizationPlanLimitPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations('CrudPages');
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
          <CardTitle>{t('editOrganizationPlanLimit')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationPlanLimitForm organizationPlanLimit={data} />
        </CardContent>
      </Card>
    </div>
  );
}
