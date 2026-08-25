import { CircleCheck, Pencil, Store, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { BranchFilters } from '@/components/dashboard/branch/branch-filters';
import BranchFormWithAddress, {
  type CashierOption,
} from '@/components/dashboard/branch/branch-form-with-address';
import DeleteModal from '@/components/dashboard/branch/delete-modal';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { TablePagination } from '@/components/dashboard/shared/table-pagination';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import { parsePage, parsePerPage } from '@/lib/utils';

type BranchRow = {
  id: string;
  name: string;
  phone: string | null;
  active: boolean;
  address: { street?: string; number?: string; city?: string } | null;
};

type CashierRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  active: boolean | null;
  branch_id: number | null;
};

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; cashier?: string; page?: string; perPage?: string;
  }>;
}

function personName(cashier: CashierRow) {
  return `${cashier.first_name ?? ''} ${cashier.last_name ?? ''}`.trim() || cashier.email || '';
}

function initials(name: string) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export default async function BranchListPage({ searchParams }: PageProps) {
  const [supabase, currentUser, t, tCommon, params] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.branch'),
    getTranslations('Common'),
    searchParams,
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let branchQuery = supabase
    .from('branch')
    .select('id, name, phone, active, address:address_id(street, number, city)')
    .order('name');

  let cashierQuery = supabase
    .from('app_user')
    .select('id, first_name, last_name, email, active, branch_id, role:role_id(name)')
    .eq('role.name', 'cashier');

  if (orgIdFilter) {
    branchQuery = branchQuery.eq('organization_id', orgIdFilter);
    cashierQuery = cashierQuery.eq('organization_id', orgIdFilter);
  }

  const [{ data: branchData, error }, { data: cashierData }] = await Promise.all([
    branchQuery,
    cashierQuery,
  ]);

  if (error) {
    return <div>{t('error')}</div>;
  }

  const cashiers = ((cashierData ?? []) as unknown as (CashierRow & { role: unknown })[])
    .filter((cashier) => cashier.role !== null);

  const cashierByBranch = new Map<string, CashierRow>();
  for (const cashier of cashiers) {
    if (cashier.branch_id !== null) {
      cashierByBranch.set(String(cashier.branch_id), cashier);
    }
  }

  const filters = {
    q: params.q?.trim() ?? '',
    status: params.status === 'active' || params.status === 'inactive' ? params.status : '',
    cashier:
      params.cashier === 'assigned' || params.cashier === 'unassigned' ? params.cashier : '',
  };

  const needle = filters.q.toLowerCase();
  // Una sola pasada: filtramos y enriquecemos en el mismo recorrido.
  const rows = ((branchData ?? []) as unknown as BranchRow[]).flatMap((branch) => {
    if (needle && !branch.name.toLowerCase().includes(needle)) return [];
    if (filters.status === 'active' && !branch.active) return [];
    if (filters.status === 'inactive' && branch.active) return [];
    const cashier = cashierByBranch.get(String(branch.id)) ?? null;
    if (filters.cashier === 'assigned' && !cashier) return [];
    if (filters.cashier === 'unassigned' && cashier) return [];
    return [{
      ...branch,
      cashier,
      addressLine: branch.address
        ? [
            [branch.address.street, branch.address.number].filter(Boolean).join(' '),
            branch.address.city,
          ]
            .filter(Boolean)
            .join(', ')
        : null,
    }];
  });

  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(rows.length / perPage));
  const visible = rows.slice((page - 1) * perPage, page * perPage);

  const activeCount = rows.filter((branch) => branch.active).length;
  const withoutCashier = rows.filter((branch) => !branch.cashier).length;

  const cashierOptions: CashierOption[] = cashiers.map((cashier) => ({
    id: String(cashier.id),
    name: personName(cashier),
    branchId: cashier.branch_id === null ? null : String(cashier.branch_id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {t('title')}
            <PlanUsageBadge feature="branches" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <PlanUsageBanner features={['branches']} />

      <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t('cashierNotice.title')}</p>
          <p className="text-xs text-muted-foreground">{t('cashierNotice.description')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <p className="flex items-center gap-2 rounded-xl border px-4 py-2.5">
            <CircleCheck className="size-4 text-brand-green" />
            <span>
              <span className="block text-lg font-bold leading-none">{activeCount}</span>
              <span className="block text-xs text-muted-foreground">
                {t('cashierNotice.activeBranches')}
              </span>
            </span>
          </p>
          <p className="flex items-center gap-2 rounded-xl border px-4 py-2.5">
            <TriangleAlert
              className={`size-4 ${withoutCashier > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            />
            <span>
              <span className="block text-lg font-bold leading-none">{withoutCashier}</span>
              <span className="block text-xs text-muted-foreground">
                {t('cashierNotice.withoutCashier')}
              </span>
            </span>
          </p>
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <BranchFilters values={filters} />

          <div className="rounded-xl border bg-card shadow-sm">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaders.name')}</TableHead>
                  <TableHead>{t('tableHeaders.address')}</TableHead>
                  <TableHead>{t('tableHeaders.phone')}</TableHead>
                  <TableHead>{t('tableHeaders.status')}</TableHead>
                  <TableHead>{t('tableHeaders.cashier')}</TableHead>
                  <TableHead>{t('tableHeaders.cashierStatus')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length > 0 ? (
                  visible.map((branch) => (
                    <TableRow
                      key={branch.id}
                      className={branch.cashier ? undefined : 'bg-destructive/5'}
                    >
                      <TableCell>
                        <span className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
                            <Store className="size-4" />
                          </span>
                          <span className="font-medium">{branch.name}</span>
                        </span>
                      </TableCell>
                      <TableCell>{branch.addressLine || 'N/A'}</TableCell>
                      <TableCell>{branch.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                            branch.active
                              ? 'bg-brand-green/10 text-brand-green'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {branch.active ? tCommon('active') : tCommon('inactive')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {branch.cashier ? (
                          <span className="flex items-center gap-2">
                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-[10px] font-semibold text-brand-violet">
                              {initials(personName(branch.cashier))}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {personName(branch.cashier)}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {branch.cashier.email}
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="text-destructive">
                            <span className="block font-medium">{t('noCashier')}</span>
                            <Link
                              className="text-xs underline"
                              href={`/dashboard/cashiers?assignTo=${branch.id}`}
                            >
                              {t('assignCashier')}
                            </Link>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {branch.cashier ? (
                          <span className="inline-flex items-center gap-1.5 text-brand-green">
                            <CircleCheck className="size-3.5" />
                            {tCommon('active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-destructive">
                            <TriangleAlert className="size-3.5" />
                            {t('withoutCashier')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="icon-sm" variant="outline">
                            <Link href={`/dashboard/branch/edit/${branch.id}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <DeleteModal branchId={branch.id} branchName={branch.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={7}>{t('empty')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4">
              <p className="text-xs text-muted-foreground">
                {t('showing', { shown: visible.length, total: rows.length })}
              </p>
              <TablePagination total={rows.length} page={page} perPage={perPage} />
            </div>
          </div>
        </div>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
              <Store className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">{t('newBranch.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('newBranch.description')}</p>
            </div>
          </div>
          <div className="mt-5">
            <BranchFormWithAddress cashiers={cashierOptions} />
          </div>
        </section>
      </div>
    </div>
  );
}
