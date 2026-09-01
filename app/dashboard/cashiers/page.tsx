import { BookOpen, Smartphone, Store } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import DeleteModal from '@/components/dashboard/app_user/delete-modal';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { TablePagination } from '@/components/dashboard/shared/table-pagination';
import { StaffFilters } from '@/components/dashboard/staff/staff-filters';
import { StaffStats } from '@/components/dashboard/staff/staff-stats';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getUsageSummaryAction } from '@/actions/dashboard/usage/actions';
import { PUNTOS_CLUB_CAJA_APK_URL } from '@/lib/mobile-apps';
import { filterStaff, getStaff, staffInitials, staffName } from '@/lib/staff/get-staff';
import { formatDateOnly, parsePage, parsePerPage } from '@/lib/utils';

const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR');

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; branch?: string; assignTo?: string; page?: string; perPage?: string;
  }>;
}

export default async function CashiersPage({ searchParams }: PageProps) {
  const [t, tCommon, params, payload, usage] = await Promise.all([
    getTranslations('Dashboard.staff.cashiers'),
    getTranslations('Common'),
    searchParams,
    getStaff('cashier'),
    getUsageSummaryAction(),
  ]);

  const filters = {
    q: params.q?.trim() ?? '',
    status: params.status === 'active' || params.status === 'inactive' ? params.status : '',
    branch: params.branch ?? '',
  };

  const rows = filterStaff(payload.members, filters);
  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(rows.length / perPage));
  const visible = rows.slice((page - 1) * perPage, page * perPage);

  const limit = usage?.features.find((f) => f.feature === 'cashiers')?.limit_value ?? null;

  const stats = {
    total: payload.members.length,
    active: payload.members.filter((member) => member.active).length,
    inactive: payload.members.filter((member) => !member.active).length,
    extra: payload.members.filter((member) => member.branchId !== null).length,
    limit,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {t('title')}
            <PlanUsageBadge feature="cashiers" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <a
          className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          href={PUNTOS_CLUB_CAJA_APK_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          <BookOpen className="size-4" />
          {t('appGuide')}
        </a>
      </div>

      <PlanUsageBanner features={['cashiers']} />

      <StaffStats data={stats} variant="cashiers" />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <StaffFilters
            basePath="/dashboard/cashiers"
            branches={payload.branches}
            showBranch
            values={filters}
          />

          <div className="rounded-xl border bg-card shadow-sm">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('headers.cashier')}</TableHead>
                  <TableHead>{t('headers.branch')}</TableHead>
                  <TableHead>{t('headers.status')}</TableHead>
                  <TableHead className="text-right">{t('headers.operations')}</TableHead>
                  <TableHead>{t('headers.lastOperation')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length > 0 ? (
                  visible.map((member) => {
                    const name = staffName(member);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <span className="flex items-center gap-2.5">
                            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-[11px] font-semibold text-brand-violet">
                              {staffInitials(name)}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium">{name || 'N/A'}</span>
                              <span className="block text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          {member.branchName ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Store className="size-3.5 text-muted-foreground" />
                              {member.branchName}
                            </span>
                          ) : (
                            <span className="text-destructive">
                              <span className="block">{t('noBranch')}</span>
                              <Link
                                className="text-xs underline"
                                href={`/dashboard/app_user/edit/${member.id}`}
                              >
                                {t('assignBranch')}
                              </Link>
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                              member.active
                                ? 'bg-brand-green/10 text-brand-green'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {member.active ? tCommon('active') : tCommon('inactive')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {NUMBER_FORMATTER.format(member.operationsThisMonth)}
                        </TableCell>
                        <TableCell>
                          {member.lastOperationAt ? (
                            <span suppressHydrationWarning>
                              {formatDateOnly(member.lastOperationAt, 'es-AR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{t('never')}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center justify-end gap-2">
                            <Link
                              className="text-xs underline"
                              href={`/dashboard/app_user/edit/${member.id}`}
                            >
                              {tCommon('edit')}
                            </Link>
                            <DeleteModal appUserId={member.id} appUserName={name} />
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={6}>{t('empty')}</TableCell>
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
              <Smartphone className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">{t('newCashier.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('newCashier.description')}</p>
            </div>
          </div>

          <div className="mt-5">
            <AppUserForm
              branches={payload.branches}
              defaultBranchId={
                payload.branches.some((b) => b.id === params.assignTo) ? params.assignTo : ''
              }
              lockedRoleName="cashier"
              redirectTo="/dashboard/cashiers"
            />
          </div>

          <div className="mt-5 rounded-xl bg-brand-blue/5 p-4">
            <p className="text-sm font-semibold">{t('whatsNext.title')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('whatsNext.body')}</p>
            <a
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
              href={PUNTOS_CLUB_CAJA_APK_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Smartphone className="size-4" />
              {t('whatsNext.download')}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
