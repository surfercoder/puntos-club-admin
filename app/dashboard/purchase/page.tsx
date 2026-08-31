import { BarChart3, History, Pencil, Send } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/purchase/delete-modal';
import {
  PurchaseFilters,
  type FilterOption,
} from '@/components/dashboard/purchase/purchase-filters';
import { PurchaseStats } from '@/components/dashboard/purchase/purchase-stats';
import ToastHandler from '@/components/dashboard/purchase/toast-handler';
import { ExcelExportButton } from '@/components/dashboard/shared/excel-export-button';
import { InfoCard } from '@/components/dashboard/shared/info-card';
import { QuickActionsCard } from '@/components/dashboard/shared/quick-actions-card';
import { SummaryCard } from '@/components/dashboard/shared/summary-card';
import { TablePagination } from '@/components/dashboard/shared/table-pagination';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { POINT_RANGES, formatDateOnly, parsePage, parsePerPage } from '@/lib/utils';

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR');

function formatCurrency(amount: string | number) {
  const num = /* c8 ignore next */ typeof amount === 'string' ? parseFloat(amount) : amount;
  return CURRENCY_FORMATTER.format(num);
}

type Related = { first_name?: string | null; last_name?: string | null; name?: string | null } | null;

function one<T>(value: T | T[] | null | undefined): T | null {
  /* c8 ignore next */
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function personName(person: Related) {
  if (!person) return null;
  return `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim() || null;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function unique(list: (FilterOption | null)[]) {
  const seen = new Map<string, FilterOption>();
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) seen.set(item.id, item);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type PurchaseRow = {
  id: string;
  purchaseNumber: string;
  date: string;
  beneficiaryId: string;
  beneficiaryName: string | null;
  cashierId: string;
  cashierName: string | null;
  branchName: string | null;
  amount: number;
  points: number;
  type: 'sale' | 'assignment';
};

// El tipo ya llega traducido desde la página: la fila no necesita el traductor.
function PurchaseTableRow({ row, typeLabel }: { row: PurchaseRow; typeLabel: string }) {
  return (
    <TableRow>
      <TableCell className="font-mono font-medium">{row.purchaseNumber}</TableCell>
      <TableCell>
        <span suppressHydrationWarning className="block">
          {formatDateOnly(row.date, 'es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })}
        </span>
        <span suppressHydrationWarning className="block text-xs text-muted-foreground">
          {new Date(row.date).toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-[10px] font-semibold text-brand-violet">
            {initials(row.beneficiaryName)}
          </span>
          {row.beneficiaryName ?? 'N/A'}
        </span>
      </TableCell>
      <TableCell>{row.cashierName ?? 'N/A'}</TableCell>
      <TableCell>{row.branchName ?? 'N/A'}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(row.amount)}</TableCell>
      <TableCell className="text-right">
        <span className="inline-block rounded-md bg-brand-pink/10 px-2 py-0.5 text-xs font-semibold text-brand-pink">
          +{NUMBER_FORMATTER.format(row.points)} pts
        </span>
      </TableCell>
      <TableCell>
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
            row.type === 'sale'
              ? 'bg-brand-blue/10 text-brand-blue'
              : 'bg-brand-violet/10 text-brand-violet'
          }`}
        >
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button asChild size="icon-sm" variant="outline">
            <Link href={`/dashboard/purchase/edit/${row.id}`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <DeleteModal purchaseId={row.id} purchaseNumber={row.purchaseNumber} />
        </div>
      </TableCell>
    </TableRow>
  );
}

type PageProps = {
  searchParams: Promise<{
    q?: string; from?: string; to?: string; branch?: string; cashier?: string;
    beneficiary?: string; type?: string; points?: string; page?: string; perPage?: string;
  }>;
};

export default async function PurchaseListPage({ searchParams }: PageProps) {
  const [t, tCommon, currentUser, params] = await Promise.all([
    getTranslations('Dashboard.purchase'),
    getTranslations('Common'),
    getCurrentUser(),
    searchParams,
  ]);
  const userIsAdmin = isAdmin(currentUser);
  const [supabase, orgIdFilter] = await Promise.all([
    userIsAdmin ? Promise.resolve(createAdminClient()) : createClient(),
    getActiveOrgIdFilter(currentUser),
  ]);

  const filters = {
    q: params.q?.trim() ?? '',
    from: params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
    to: params.to?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
    branch: params.branch ?? '',
    cashier: params.cashier ?? '',
    beneficiary: params.beneficiary ?? '',
    type: params.type === 'sale' || params.type === 'assignment' ? params.type : '',
    points: POINT_RANGES.some((r) => r.key === params.points) ? (params.points as string) : '',
  };

  let query = supabase
    .from('purchase')
    .select(`
      *,
      beneficiary:beneficiary_id(id, first_name, last_name, email),
      cashier:app_user!purchase_cashier_id_fkey(id, first_name, last_name),
      branch:branch_id(id, name)
    `)
    .order('purchase_date', { ascending: false });

  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }
  if (filters.branch) {
    query = query.eq('branch_id', filters.branch);
  }
  if (filters.cashier) {
    query = query.eq('cashier_id', filters.cashier);
  }
  if (filters.beneficiary) {
    query = query.eq('beneficiary_id', filters.beneficiary);
  }
  // ponytail: los límites de fecha se interpretan en la zona horaria de la DB.
  if (filters.from) {
    query = query.gte('purchase_date', filters.from);
  }
  if (filters.to) {
    query = query.lte('purchase_date', `${filters.to}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  const rows: PurchaseRow[] = (data ?? []).map((purchase) => {
    const beneficiary = one(purchase.beneficiary as Related | Related[]);
    const cashier = one(purchase.cashier as Related | Related[]);
    const branch = one(purchase.branch as Related | Related[]);
    const amount = Number(purchase.total_amount) || 0;

    return {
      id: String(purchase.id),
      purchaseNumber: purchase.purchase_number as string,
      date: purchase.purchase_date as string,
      beneficiaryId: String(purchase.beneficiary_id ?? ''),
      beneficiaryName: personName(beneficiary),
      cashierId: String(purchase.cashier_id ?? ''),
      cashierName: personName(cashier),
      branchName: branch?.name ?? null,
      amount,
      points: Number(purchase.points_earned) || 0,
      // El modelo no guarda el tipo: una operación con importe es una venta,
      // y sin importe es una asignación manual de puntos.
      type: amount > 0 ? ('sale' as const) : ('assignment' as const),
    };
  });

  const needle = filters.q.toLowerCase();
  const range = POINT_RANGES.find((r) => r.key === filters.points);
  const filtered = rows.filter((row) => {
    if (needle) {
      const haystack = [row.purchaseNumber, row.beneficiaryName, row.cashierName, row.branchName]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.type && row.type !== filters.type) return false;
    if (range && (row.points < range.min || row.points >= range.max)) return false;
    return true;
  });

  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);
  const totalPoints = filtered.reduce((sum, r) => sum + r.points, 0);
  const reached = new Set(filtered.flatMap((r) => r.beneficiaryId || [])).size;
  // Por id: dos cajeros homónimos son dos personas, no una.
  const activeCashiers = new Set(filtered.flatMap((r) => r.cashierId || [])).size;

  const stats = {
    operations: filtered.length,
    totalAmount,
    pointsAssigned: totalPoints,
    beneficiariesReached: reached,
    averagePoints: filtered.length ? Math.round(totalPoints / filtered.length) : 0,
  };

  const branchOptions = unique(
    (data ?? []).map((p) => {
      const branch = one(p.branch as Related | Related[]) as { id?: string; name?: string } | null;
      return branch?.id ? { id: String(branch.id), name: branch.name ?? '' } : null;
    }),
  );
  const cashierOptions = unique(
    (data ?? []).map((p) => {
      const cashier = one(p.cashier as Related | Related[]) as
        | { id?: string; first_name?: string; last_name?: string } | null;
      return cashier?.id
        ? { id: String(cashier.id), name: personName(cashier) ?? '' }
        : null;
    }),
  );
  const beneficiaryOptions = unique(
    (data ?? []).map((p) => {
      const beneficiary = one(p.beneficiary as Related | Related[]) as
        | { id?: string; first_name?: string; last_name?: string } | null;
      return beneficiary?.id
        ? { id: String(beneficiary.id), name: personName(beneficiary) ?? '' }
        : null;
    }),
  );

  return (
    <div className="space-y-6">
      <ToastHandler />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <BarChart3 className="size-4" />
            {t('viewStats')}
          </Link>
          <ExcelExportButton
            filename="cajero-virtual.xlsx"
            label={tCommon('export')}
            headers={[
              t('tableHeaders.purchaseNumber'),
              t('tableHeaders.date'),
              t('tableHeaders.beneficiary'),
              t('tableHeaders.cashier'),
              t('tableHeaders.branch'),
              t('tableHeaders.amount'),
              t('tableHeaders.points'),
            ]}
            rows={filtered.map((r) => [
              r.purchaseNumber, r.date, r.beneficiaryName, r.cashierName,
              r.branchName, r.amount, r.points,
            ])}
          />
          <Link
            href="/dashboard/purchase/create"
            className="brand-cta inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            {t('newButton')}
          </Link>
        </div>
      </div>

      <PurchaseStats data={stats} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <PurchaseFilters
            values={filters}
            branches={branchOptions}
            cashiers={cashierOptions}
            beneficiaries={beneficiaryOptions}
          />

          <div className="rounded-xl border bg-card shadow-sm">
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t('showing', { shown: visible.length, total: filtered.length })}
            </p>
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaders.purchaseNumber')}</TableHead>
                  <TableHead>{t('tableHeaders.date')}</TableHead>
                  <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
                  <TableHead>{t('tableHeaders.cashier')}</TableHead>
                  <TableHead>{t('tableHeaders.branch')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.amount')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.points')}</TableHead>
                  <TableHead>{t('tableHeaders.type')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length > 0 ? (
                  visible.map((row) => (
                    <PurchaseTableRow
                      key={row.id}
                      row={row}
                      typeLabel={t(`types.${row.type}`)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={9}>{t('empty')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination total={filtered.length} page={page} perPage={perPage} />
          </div>
        </div>

        <div className="space-y-4">
          <SummaryCard
            title={t('summary.title')}
            rows={[
              { label: t('summary.operations'), value: NUMBER_FORMATTER.format(stats.operations) },
              { label: t('summary.totalAmount'), value: formatCurrency(stats.totalAmount) },
              { label: t('summary.pointsAssigned'), value: `${NUMBER_FORMATTER.format(stats.pointsAssigned)} pts`, highlight: true },
              { label: t('summary.averagePoints'), value: `${NUMBER_FORMATTER.format(stats.averagePoints)} pts`, highlight: true },
              { label: t('summary.beneficiariesReached'), value: NUMBER_FORMATTER.format(stats.beneficiariesReached) },
              { label: t('summary.activeCashiers'), value: NUMBER_FORMATTER.format(activeCashiers) },
            ]}
          />

          <QuickActionsCard
            title={t('quickActions.title')}
            actions={[
              {
                href: '/dashboard/purchase/create',
                icon: Send,
                tint: 'bg-brand-violet/10 text-brand-violet',
                title: t('quickActions.assign.title'),
                description: t('quickActions.assign.description'),
              },
              {
                href: '/dashboard',
                icon: BarChart3,
                tint: 'bg-brand-orange/10 text-brand-orange',
                title: t('quickActions.reports.title'),
                description: t('quickActions.reports.description'),
              },
              {
                href: '/dashboard/beneficiary',
                icon: History,
                tint: 'bg-brand-blue/10 text-brand-blue',
                title: t('quickActions.history.title'),
                description: t('quickActions.history.description'),
              },
            ]}
          />

          <InfoCard title={t('info.title')}>
            <p>{t('info.realtime')}</p>
            <p>{t('info.delay')}</p>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
