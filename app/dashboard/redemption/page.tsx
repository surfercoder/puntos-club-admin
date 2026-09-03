import { BarChart3, CircleCheck, CircleX, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import type { FilterOption } from '@/components/dashboard/purchase/purchase-filters';
import { RedemptionDonut } from '@/components/dashboard/redemption/redemption-donut';
import { RedemptionFilters } from '@/components/dashboard/redemption/redemption-filters';
import { RedemptionStats } from '@/components/dashboard/redemption/redemption-stats';
import { PendingRedemptionActions } from '@/components/dashboard/redemption/row-actions';
import { RedemptionStatusBadge } from '@/components/dashboard/redemption/status-badge';
import { CopyableCode } from '@/components/dashboard/shared/copyable-code';
import { ExcelExportButton } from '@/components/dashboard/shared/excel-export-button';
import { InfoCard } from '@/components/dashboard/shared/info-card';
import { QuickActionsCard } from '@/components/dashboard/shared/quick-actions-card';
import { TablePagination } from '@/components/dashboard/shared/table-pagination';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  REDEMPTION_STATUSES,
  formatDateOnly,
  parsePage,
  parsePerPage,
  redemptionCode,
} from '@/lib/utils';
import type { RedemptionStatus } from '@/types/redemption';

const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR');

type Person = { id?: number | string; first_name?: string | null; last_name?: string | null; email?: string | null } | null;

interface RedemptionWithRelations {
  id: string;
  beneficiary_id: string;
  product_id?: string | null;
  points_used: number;
  redemption_date: string;
  status: RedemptionStatus | null;
  beneficiary: Person;
  product: { id?: number | string; name: string } | null;
  deliveredBy: Person;
}

// Deduplica por id y ordena por nombre para los combos de filtro.
function unique(list: (FilterOption | null)[]) {
  const seen = new Map<string, FilterOption>();
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) seen.set(item.id, item);
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function personName(person: Person) {
  if (!person) return null;
  const name = `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim();
  return name || person.email || null;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; from?: string; to?: string;
    beneficiary?: string; product?: string; page?: string; perPage?: string;
  }>;
}

function parseRedemptionFilters(params: Awaited<PageProps['searchParams']>) {
  return {
    q: params.q?.trim() ?? '',
    status: REDEMPTION_STATUSES.find((s) => s === params.status) ?? '',
    from: params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
    to: params.to?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
    beneficiary: params.beneficiary ?? '',
    product: params.product ?? '',
  };
}

type RedemptionRow = RedemptionWithRelations & { code: string; beneficiaryName: string | null; deliveredByName: string | null };

function mapRedemptionRows(all: RedemptionWithRelations[]): RedemptionRow[] {
  return all.map((redemption) => ({
    ...redemption,
    code: redemptionCode(redemption.id, redemption.redemption_date),
    beneficiaryName: personName(redemption.beneficiary),
    deliveredByName: personName(redemption.deliveredBy),
  }));
}

function computeRedemptionStats(filtered: RedemptionRow[]) {
  const breakdown = {
    pending: filtered.filter((r) => r.status === 'pending').length,
    delivered: filtered.filter((r) => r.status === 'delivered').length,
    cancelled: filtered.filter((r) => r.status === 'cancelled').length,
  };

  return {
    breakdown,
    stats: {
      total: filtered.length,
      pointsUsed: filtered.reduce((sum, r) => sum + (Number(r.points_used) || 0), 0),
      ...breakdown,
    },
  };
}

function buildRedemptionFilterOptions(rows: RedemptionRow[]) {
  const beneficiaryOptions = unique(
    rows.map((r) =>
      r.beneficiary?.id
        ? { id: String(r.beneficiary.id), name: r.beneficiaryName ?? '' }
        : null,
    ),
  );
  const productOptions = unique(
    rows.map((r) => (r.product?.id ? { id: String(r.product.id), name: r.product.name } : null)),
  );
  return { beneficiaryOptions, productOptions };
}

// Las etiquetas de estado y traducciones llegan resueltas desde la página.
function RedemptionTableRow({ redemption }: { redemption: RedemptionRow }) {
  return (
    <TableRow>
      <TableCell><CopyableCode value={redemption.code} /></TableCell>
      <TableCell>
        <span className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-[10px] font-semibold text-brand-violet">
            {initials(redemption.beneficiaryName)}
          </span>
          {redemption.beneficiaryName ?? 'N/A'}
        </span>
      </TableCell>
      <TableCell>{redemption.product?.name || 'N/A'}</TableCell>
      <TableCell className="text-right tabular-nums">
        {NUMBER_FORMATTER.format(redemption.points_used)} pts
      </TableCell>
      <TableCell>
        <RedemptionStatusBadge status={redemption.status} />
      </TableCell>
      <TableCell>
        <span suppressHydrationWarning className="block">
          {formatDateOnly(redemption.redemption_date, 'es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })}
        </span>
        <span suppressHydrationWarning className="block text-xs text-muted-foreground">
          {new Date(redemption.redemption_date).toLocaleTimeString('es-AR', {
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </TableCell>
      <TableCell>{redemption.deliveredByName ?? '—'}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {redemption.status === 'pending' ? (
            <PendingRedemptionActions redemptionId={redemption.id} />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default async function RedemptionListPage({ searchParams }: PageProps) {
  const [t, tCommon, currentUser, params] = await Promise.all([
    getTranslations('Dashboard.redemption'),
    getTranslations('Common'),
    getCurrentUser(),
    searchParams,
  ]);
  const userIsAdmin = isAdmin(currentUser);

  const supabase = userIsAdmin ? createAdminClient() : await createClient();
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  const filters = parseRedemptionFilters(params);

  let query = supabase
    .from('redemption')
    .select(`
      *,
      beneficiary:beneficiary(id, first_name, last_name, email),
      product:product(id, name, organization_id),
      deliveredBy:app_user!redemption_delivered_by_fkey(first_name, last_name)
    `)
    .order('redemption_date', { ascending: false });

  // ponytail: date bounds are interpreted in the DB timezone; add an explicit
  // tz offset here if org-local day boundaries ever matter.
  const eqFilters: [string, string | number | false][] = [
    ['organization_id', orgIdFilter || false],
    ['status', filters.status],
    ['beneficiary_id', filters.beneficiary],
    ['product_id', filters.product],
  ];
  for (const [column, value] of eqFilters) {
    if (value) query = query.eq(column, value);
  }
  if (filters.from) query = query.gte('redemption_date', filters.from);
  if (filters.to) query = query.lte('redemption_date', `${filters.to}T23:59:59.999`);

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  const all = (data ?? []) as unknown as RedemptionWithRelations[];
  const rows = mapRedemptionRows(all);

  const needle = filters.q.toLowerCase();
  const filtered = needle
    ? rows.filter((row) =>
        [row.code, row.beneficiaryName, row.product?.name]
          .filter(Boolean).join(' ').toLowerCase().includes(needle),
      )
    : rows;

  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const { breakdown, stats } = computeRedemptionStats(filtered);
  const { beneficiaryOptions, productOptions } = buildRedemptionFilterOptions(rows);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExcelExportButton
            filename="canjes.xlsx"
            label={tCommon('export')}
            headers={[
              t('tableHeaders.code'),
              t('tableHeaders.beneficiary'),
              t('tableHeaders.product'),
              t('tableHeaders.pointsUsed'),
              t('tableHeaders.status'),
              t('tableHeaders.date'),
              t('tableHeaders.deliveredBy'),
            ]}
            rows={filtered.map((r) => [
              r.code, r.beneficiaryName, r.product?.name, r.points_used,
              r.status, r.redemption_date, r.deliveredByName,
            ])}
          />
          <Link
            href="/dashboard"
            className="brand-cta inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            <BarChart3 className="size-4" />
            {t('reportButton')}
          </Link>
        </div>
      </div>

      <RedemptionStats data={stats} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <RedemptionFilters
            values={filters}
            beneficiaries={beneficiaryOptions}
            products={productOptions}
          />

          <div className="rounded-xl border bg-card shadow-sm">
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t('showing', { shown: visible.length, total: filtered.length })}
            </p>
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaders.code')}</TableHead>
                  <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
                  <TableHead>{t('tableHeaders.product')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.pointsUsed')}</TableHead>
                  <TableHead>{t('tableHeaders.status')}</TableHead>
                  <TableHead>{t('tableHeaders.date')}</TableHead>
                  <TableHead>{t('tableHeaders.deliveredBy')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length > 0 ? (
                  visible.map((redemption) => (
                    <RedemptionTableRow key={redemption.id} redemption={redemption} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={8}>{t('empty')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination total={filtered.length} page={page} perPage={perPage} />
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">{t('summaryTitle')}</h2>
            <div className="mt-4">
              <RedemptionDonut data={breakdown} />
            </div>
          </section>

          <QuickActionsCard
            title={t('quickActions.title')}
            actions={[
              {
                href: '/dashboard/redemption?status=pending',
                icon: CircleCheck,
                tint: 'bg-brand-green/10 text-brand-green',
                title: t('quickActions.deliver.title'),
                description: t('quickActions.deliver.description'),
              },
              {
                href: '/dashboard/redemption?status=pending',
                icon: CircleX,
                tint: 'bg-brand-pink/10 text-brand-pink',
                title: t('quickActions.cancel.title'),
                description: t('quickActions.cancel.description'),
              },
              {
                href: '/dashboard/product',
                icon: Eye,
                tint: 'bg-brand-blue/10 text-brand-blue',
                title: t('quickActions.products.title'),
                description: t('quickActions.products.description'),
              },
              {
                href: '/dashboard/redemption?status=delivered',
                icon: Download,
                tint: 'bg-brand-violet/10 text-brand-violet',
                title: t('quickActions.export.title'),
                description: t('quickActions.export.description'),
              },
            ]}
          />

          <InfoCard title={t('info.title')}>
            <p>{t('info.body')}</p>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
