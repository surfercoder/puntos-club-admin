import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteModal from '@/components/dashboard/stock/delete-modal';
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

interface StockWithRelations {
  id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  minimum_quantity: number;
  last_updated: string;
  branch: {
    name: string;
  };
  product: {
    name: string;
  };
}

export default async function StockListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      branch:branch(name),
      product:product(name)
    `)
    .order('last_updated', { ascending: false });

  if (error) {
    return <div>Error fetching stock records</div>;
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
              <span className="text-sm font-medium text-gray-900">Stock</span>
            </div>
          </li>
        </ol>
      </nav>
      
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
            {data && data.length > 0 ? (
              data.map((stock: StockWithRelations) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">
                    {stock.branch?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{stock.product?.name || 'N/A'}</TableCell>
                  <TableCell>{stock.quantity}</TableCell>
                  <TableCell>{stock.minimum_quantity}</TableCell>
                  <TableCell>
                    {new Date(stock.last_updated).toLocaleDateString()}
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
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/stock/edit/${stock.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        stockId={stock.id}
                        stockDescription={`${stock.product?.name || 'Product'} - ${stock.branch?.name || 'Branch'}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No stock records found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}