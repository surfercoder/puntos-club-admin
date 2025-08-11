import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AppOrder } from '@/types/app_order';
import DeleteModal from '@/components/dashboard/app_order/delete-modal';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

export default async function AppOrderListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('app_order').select('*').order('creation_date', { ascending: false });

  if (error) {
    return <div>Error fetching orders</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600">
              Dashboard
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900">Orders</span>
            </div>
          </li>
        </ol>
      </nav>
      
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
            {data && data.length > 0 ? (
              data.map((order: AppOrder) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    {new Date(order.creation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{order.total_points}</TableCell>
                  <TableCell>{order.observations || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" asChild>
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
                <TableCell colSpan={5} className="text-center py-4">No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}