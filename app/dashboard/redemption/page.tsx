import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

import DeleteModal from '@/components/dashboard/redemption/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

interface RedemptionWithRelations {
  id: string;
  beneficiary_id: string;
  product_id?: string | null;
  order_id: string;
  points_used: number;
  quantity: number;
  redemption_date: string;
  beneficiary: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  product: {
    name: string;
    organization_id?: number;
  } | null;
  app_order: {
    order_number: string;
  };
}

export default async function RedemptionListPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const { data, error } = await supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(first_name, last_name, email),
      product:product(name, organization_id),
      app_order:app_order(order_number)
    `)
    .order('redemption_date', { ascending: false });

  if (error) {
    return <div>Error fetching redemptions</div>;
  }

  const filteredData = activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)
    ? data?.filter((redemption: RedemptionWithRelations) => 
        redemption.product?.organization_id === activeOrgIdNumber
      )
    : data;

  return (
    <div className="space-y-6">      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Redemptions</h1>
          <p className="text-muted-foreground">Manage redemptions in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/redemption/create">+ New Redemption</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Points Used</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((redemption: RedemptionWithRelations) => (
                <TableRow key={redemption.id}>
                  <TableCell className="font-medium">
                    {redemption.beneficiary?.first_name || redemption.beneficiary?.last_name 
                      ? `${redemption.beneficiary.first_name || ''} ${redemption.beneficiary.last_name || ''}`.trim()
                      : redemption.beneficiary?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{redemption.product?.name || 'N/A'}</TableCell>
                  <TableCell>{redemption.app_order?.order_number || 'N/A'}</TableCell>
                  <TableCell>{redemption.points_used}</TableCell>
                  <TableCell>{redemption.quantity}</TableCell>
                  <TableCell>
                    {new Date(redemption.redemption_date).toLocaleString('en-US', { 
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/redemption/edit/${redemption.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        redemptionDescription={`${redemption.product?.name || 'Product'} - ${redemption.points_used} points`}
                        redemptionId={redemption.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No redemptions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}