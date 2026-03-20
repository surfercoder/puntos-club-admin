import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/purchase/delete-modal';
import ToastHandler from '@/components/dashboard/purchase/toast-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PurchaseListPage() {
  const t = await getTranslations('Dashboard.purchase');
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let query = supabase
    .from('purchase')
    .select(`
      *,
      beneficiary:beneficiary_id(first_name, last_name, email),
      cashier:app_user!purchase_cashier_id_fkey(first_name, last_name),
      branch:branch_id(name)
    `)
    .order('purchase_date', { ascending: false });

  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num);
  };

  return (
    <div className="space-y-6">
      <ToastHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchase/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.purchaseNumber')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
              <TableHead>{t('tableHeaders.cashier')}</TableHead>
              <TableHead>{t('tableHeaders.branch')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.amount')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.points')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((purchase) => {
                const beneficiary = Array.isArray(purchase.beneficiary) ? purchase.beneficiary[0] : purchase.beneficiary;
                const cashier = Array.isArray(purchase.cashier) ? purchase.cashier[0] : purchase.cashier;
                const branch = Array.isArray(purchase.branch) ? purchase.branch[0] : purchase.branch;

                return (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono font-medium">{purchase.purchase_number}</TableCell>
                    <TableCell>{new Date(purchase.purchase_date).toLocaleString()}</TableCell>
                    <TableCell>
                      {beneficiary ? `${beneficiary.first_name} ${beneficiary.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {cashier ? `${cashier.first_name} ${cashier.last_name}` : 'N/A'}
                    </TableCell>
                    <TableCell>{branch?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(purchase.total_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">+{purchase.points_earned} pts</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/purchase/edit/${purchase.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteModal purchaseId={String(purchase.id)} purchaseNumber={purchase.purchase_number} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={8}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
