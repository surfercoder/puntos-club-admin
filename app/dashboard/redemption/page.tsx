import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteModal from '@/components/dashboard/redemption/delete-modal';
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
  } | null;
  app_order: {
    order_number: string;
  };
}

export default async function RedemptionListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(first_name, last_name, email),
      product:product(name),
      app_order:app_order(order_number)
    `)
    .order('redemption_date', { ascending: false });

  if (error) {
    return <div>Error fetching redemptions</div>;
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
              <span className="text-sm font-medium text-gray-900">Redemptions</span>
            </div>
          </li>
        </ol>
      </nav>
      
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
            {data && data.length > 0 ? (
              data.map((redemption: RedemptionWithRelations) => (
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
                    {new Date(redemption.redemption_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/dashboard/redemption/edit/${redemption.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        redemptionId={redemption.id}
                        redemptionDescription={`${redemption.product?.name || 'Product'} - ${redemption.points_used} points`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No redemptions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}