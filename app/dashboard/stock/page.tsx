import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

import DeleteModal from '@/components/dashboard/stock/delete-modal';
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

interface StockWithRelations {
  id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  minimum_quantity: number;
  last_updated: string;
  branch: {
    name: string;
    organization_id: number;
  };
  product: {
    name: string;
  };
}

export default async function StockListPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      branch:branch(name, organization_id),
      product:product(name)
    `)
    .order('last_updated', { ascending: false });

  if (error) {
    return <div>Error fetching stock records</div>;
  }

  // Filter by organization through branch relationship
  const filteredData = activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)
    ? data?.filter((stock: StockWithRelations) => stock.branch?.organization_id === activeOrgIdNumber)
    : data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stock</h1>
          <p className="text-muted-foreground">Manage product stock levels in your system</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/stock/create">+ New Stock Record</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Minimum Stock</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData && filteredData.length > 0 ? (
              filteredData.map((stock: StockWithRelations) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    {stock.branch?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{stock.product?.name || 'N/A'}</TableCell>
                  <TableCell>{stock.quantity}</TableCell>
                  <TableCell>{stock.minimum_quantity}</TableCell>
                  <TableCell>
                    {new Date(stock.last_updated).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stock.quantity > stock.minimum_quantity 
                        ? 'bg-green-100 text-green-800' 
                        : stock.quantity === stock.minimum_quantity
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.quantity > stock.minimum_quantity 
                        ? 'In Stock' 
                        : stock.quantity === stock.minimum_quantity
                        ? 'Low Stock'
                        : 'Out of Stock'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/stock/edit/${stock.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        stockDescription={`${stock.product?.name || 'Product'} - ${stock.branch?.name || 'Branch'}`}
                        stockId={stock.id}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>No stock records found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}