import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface StockWithRelations {
  id: string;
  branch_id: string;
  product_id: string;
  quantity: number;
  minimum_quantity: number;
  branch: {
    name: string;
    organization_id: number;
  };
  product: {
    name: string;
  };
}

export default async function StockListPage() {
  const [t, currentUser] = await Promise.all([
    getTranslations('Dashboard.stock'),
    getCurrentUser(),
  ]);
  const userIsAdmin = isAdmin(currentUser);

  const [supabase, orgIdFilter] = await Promise.all([
    userIsAdmin ? Promise.resolve(createAdminClient()) : createClient(),
    getActiveOrgIdFilter(currentUser),
  ]);

  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      branch:branch(name, organization_id),
      product:product(name)
    `);

  if (error) {
    return <div>{t('error')}</div>;
  }

  const filteredData = orgIdFilter
    ? data?.filter((stock: StockWithRelations) => stock.branch?.organization_id === orgIdFilter)
    : data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/stock/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.branch')}</TableHead>
              <TableHead>{t('tableHeaders.product')}</TableHead>
              <TableHead>{t('tableHeaders.currentStock')}</TableHead>
              <TableHead>{t('tableHeaders.minimumStock')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stock.quantity > stock.minimum_quantity 
                        ? 'bg-green-100 text-green-800' 
                        : stock.quantity === stock.minimum_quantity
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.quantity > stock.minimum_quantity
                        ? t('statusInStock')
                        : stock.quantity === stock.minimum_quantity
                        ? t('statusLowStock')
                        : t('statusOutOfStock')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/stock/edit/${stock.id}`}>
                          <Pencil className="size-4" />
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
                <TableCell className="text-center py-4" colSpan={6}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}