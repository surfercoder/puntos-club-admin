import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

import StockForm from '@/components/dashboard/stock/stock-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

export default async function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;
  
  const id = (await params).id;
  const { data, error } = await supabase
    .from('stock')
    .select('*, branch:branch(organization_id)')
    .eq('id', id)
    .single();

  if (error) {
    return <div>Error fetching stock record</div>;
  }

  if (!data) { notFound(); }

  // Verify stock belongs to current organization
  if (activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    const stockBranch = data.branch as { organization_id: number } | null;
    if (stockBranch?.organization_id !== activeOrgIdNumber) {
      notFound();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Stock Record</CardTitle>
      </CardHeader>
      <CardContent>
        <StockForm stock={data} />
      </CardContent>
    </Card>
  );
}