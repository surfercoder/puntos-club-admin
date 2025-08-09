import { createClient } from '@/lib/supabase/server';
import OrganizationForm from '@/components/dashboard/organization/organization-form';
import { notFound } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const id = (await params).id;
  const { data, error } = await supabase.from('organization').select('*').eq('id', id).single();

  if (error) {
    return <div>Error fetching organization</div>;
  }

  if (!data) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizationForm organization={data} />
        </CardContent>
      </Card>
    </div>
  );
}
