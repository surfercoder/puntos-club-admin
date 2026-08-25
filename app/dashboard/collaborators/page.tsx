import { CircleCheck, ShieldCheck, UserCog } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import AppUserForm from '@/components/dashboard/app_user/app_user-form';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { CsvExportButton } from '@/components/dashboard/shared/csv-export-button';
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
import { filterStaff, getStaff, staffInitials, staffName } from '@/lib/staff/get-staff';
import { formatDateOnly, parsePage, parsePerPage } from '@/lib/utils';

const PERMISSIONS = [
  'beneficiaries',
  'cashiers',
  'redemptions',
  'products',
  'pointsRules',
  'branches',
  'notifications',
] as const;

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; page?: string; perPage?: string;
  }>;
}

export default async function CollaboratorsPage({ searchParams }: PageProps) {
  const [t, tCommon, params, payload, usage] = await Promise.all([
    getTranslations('Dashboard.staff.collaborators'),
    getTranslations('Common'),
    searchParams,
    getStaff('collaborator'),
    getUsageSummaryAction(),
  ]);

  const filters = {
    q: params.q?.trim() ?? '',
    status: params.status === 'active' || params.status === 'inactive' ? params.status : '',
    branch: '',
  };

  const rows = filterStaff(payload.members, filters);
  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(rows.length / perPage));
  const visible = rows.slice((page - 1) * perPage, page * perPage);

  const limit = usage?.features.find((f) => f.feature === 'collaborators')?.limit_value ?? null;

  const stats = {
    total: payload.members.length,
    active: payload.members.filter((member) => member.active).length,
    inactive: payload.members.filter((member) => !member.active).length,
    extra: payload.branches.length,
    limit,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {t('title')}
            <PlanUsageBadge feature="collaborators" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <CsvExportButton
          filename="colaboradores.csv"
          headers={[t('headers.collaborator'), tCommon('email'), t('headers.status')]}
          label={tCommon('export')}
          rows={rows.map((member) => [
            staffName(member),
            member.email,
            member.active ? tCommon('active') : tCommon('inactive'),
          ])}
        />
      </div>

      <PlanUsageBanner features={['collaborators']} />

      <StaffStats data={stats} variant="collaborators" />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <StaffFilters
            basePath="/dashboard/collaborators"
            branches={payload.branches}
            showBranch={false}
            values={filters}
          />

          <div className="rounded-xl border bg-card shadow-sm">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('headers.collaborator')}</TableHead>
                  <TableHead>{t('headers.role')}</TableHead>
                  <TableHead>{t('headers.status')}</TableHead>
                  <TableHead>{t('headers.since')}</TableHead>
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
                          <span className="inline-block rounded-md bg-brand-violet/10 px-2 py-0.5 text-xs font-medium text-brand-violet">
                            {t('roleName')}
                          </span>
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
                        <TableCell>
                          {member.createdAt ? (
                            <span suppressHydrationWarning>
                              {formatDateOnly(member.createdAt, 'es-AR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                timeZone: 'UTC',
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={4}>{t('empty')}</TableCell>
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

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
                <UserCog className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{t('newCollaborator.title')}</h2>
                <p className="text-xs text-muted-foreground">
                  {t('newCollaborator.description')}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <AppUserForm
                lockedRoleName="collaborator"
                redirectTo="/dashboard/collaborators"
              />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4 text-brand-violet" />
              {t('permissions.title')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('permissions.subtitle')}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {PERMISSIONS.map((permission) => (
                <li key={permission} className="flex items-start gap-2.5">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-green" />
                  {t(`permissions.items.${permission}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {t('permissions.note')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
