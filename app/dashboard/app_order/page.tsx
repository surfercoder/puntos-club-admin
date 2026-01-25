import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

import DeleteModal from '@/components/dashboard/app_order/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { AppOrder } from '@/types/app_order';

interface AppOrderWithRelations extends AppOrder {
  redemption?: Array<{
    product?: {
      organization_id?: number;
    } | null;
  }>;
}

export default async function AppOrderListPage() {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const { data, error } = await supabase
    .from('app_order')
    .select(`
      *,
      redemption(
        product(organization_id)
      )
    `)
    .order('creation_date', { ascending: false });

  if (error) {
    return <div>Error fetching orders</div>;
  }

  // Only filter by organization for non-admin users
  const filteredData = !userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)
    ? data?.filter((order: AppOrderWithRelations) =>
        order.redemption?.some(r => r.product?.organization_id === activeOrgIdNumber)
      )
    : data;

  return (
    <div className="space-y-6">     
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage orders in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/app_order/create">+ New Order</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Creation Date</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead>Observations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((order: AppOrder) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    {new Date(order.creation_date).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell>{order.total_points}</TableCell>
                  <TableCell>{order.observations || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/app_order/edit/${order.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        appOrderId={order.id}
                        appOrderNumber={order.order_number}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}