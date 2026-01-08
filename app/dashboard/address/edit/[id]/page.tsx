import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import AddressForm from '@/components/dashboard/address/address-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditAddressPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const id = (await params).id;
  
  let query = supabase.from('address').select('*').eq('id', id);
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }
  
  const { data, error } = await query.single();

  if (error) {
    return <div>Error fetching address</div>;
  }

  if (!data) {
    notFound();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Address</CardTitle>
      </CardHeader>
      <CardContent>
        <AddressForm address={data} />
      </CardContent>
    </Card>
  );
}
