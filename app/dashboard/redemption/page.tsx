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

const STATUSES: RedemptionStatus[] = ['pending', 'delivered', 'cancelled'];
const FIELD_CLASS = 'border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs';

interface PageProps {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}

export default async function RedemptionListPage({ searchParams }: PageProps) {
  const [t, currentUser, params] = await Promise.all([
    getTranslations('Dashboard.redemption'),
    getCurrentUser(),
    searchParams,
  ]);
  const userIsAdmin = isAdmin(currentUser);

  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  const status = STATUSES.find((s) => s === params.status) ?? '';
  const from = params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '';
  const to = params.to?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '';

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
  if (status) {
    query = query.eq('status', status);
  }
  // ponytail: date bounds are interpreted in the DB timezone; add an explicit
  // tz offset here if org-local day boundaries ever matter.
  if (from) {
    query = query.gte('redemption_date', from);
  }
  if (to) {
    query = query.lte('redemption_date', `${to}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <label className="flex flex-col gap-1 text-sm">
          {t('filters.status')}
          <select
            className={FIELD_CLASS}
            defaultValue={status}
            name="status"
          >
            <option value="">{t('filters.allStatuses')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('filters.from')}
          <input
            className={FIELD_CLASS}
            defaultValue={from}
            name="from"
            type="date"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('filters.to')}
          <input
            className={FIELD_CLASS}
            defaultValue={to}
            name="to"
            type="date"
          />
        </label>
        <Button type="submit">{t('filters.apply')}</Button>
        {(status || from || to) && (
          <Button asChild type="button" variant="ghost">
            <Link href="/dashboard/redemption">{t('filters.clear')}</Link>
          </Button>
        )}
      </form>

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
                      {redemption.status === 'pending' && (
                        <PendingRedemptionActions redemptionId={redemption.id} />
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
