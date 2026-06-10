import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/redemption/delete-modal';
import { PendingRedemptionActions } from '@/components/dashboard/redemption/row-actions';
import { RedemptionStatusBadge } from '@/components/dashboard/redemption/status-badge';
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
import { formatDateTime } from '@/lib/utils';
import type { RedemptionStatus } from '@/types/redemption';

interface RedemptionWithRelations {
  id: string;
  beneficiary_id: string;
  product_id?: string | null;
  organization_id?: number | null;
  points_used: number;
  redemption_date: string;
  status: RedemptionStatus | null;
  beneficiary: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  product: {
    name: string;
    organization_id?: number;
  } | null;
}

export default async function RedemptionListPage() {
  const [t, currentUser] = await Promise.all([
    getTranslations('Dashboard.redemption'),
    getCurrentUser(),
  ]);
  const userIsAdmin = isAdmin(currentUser);

  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let query = supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(first_name, last_name, email),
      product:product(name, organization_id)
    `)
    .order('redemption_date', { ascending: false });

  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/redemption/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
              <TableHead>{t('tableHeaders.product')}</TableHead>
              <TableHead>{t('tableHeaders.pointsUsed')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
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
                  <TableCell>{redemption.points_used}</TableCell>
                  <TableCell>
                    <RedemptionStatusBadge status={redemption.status} />
                  </TableCell>
                  <TableCell>
                    <span suppressHydrationWarning>{formatDateTime(redemption.redemption_date, 'es-AR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {redemption.status === 'pending' ? (
                        <PendingRedemptionActions redemptionId={redemption.id} />
                      ) : (
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/redemption/edit/${redemption.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      )}
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
                <TableCell className="text-center py-4" colSpan={6}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
