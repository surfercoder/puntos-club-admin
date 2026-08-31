import { Eye, MapPin, Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { BeneficiaryFilters } from '@/components/dashboard/beneficiary/beneficiary-filters';
import {
  BeneficiaryHeatmap,
  type BeneficiaryPoint,
} from '@/components/dashboard/beneficiary/beneficiary-heatmap';
import { BeneficiaryStats } from '@/components/dashboard/beneficiary/beneficiary-stats';
import DeleteModal from '@/components/dashboard/beneficiary/delete-modal';
import { HideButton } from '@/components/dashboard/beneficiary/hide-button';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { ExcelExportButton } from '@/components/dashboard/shared/excel-export-button';
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
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { formatDateOnly, parsePage, parsePerPage } from '@/lib/utils';
import type { Beneficiary } from '@/types/beneficiary';

// 'member' = socio activo de la org (o de alguna, en la vista global de admin);
// 'left' = tiene membresia pero se dio de baja; 'none' = no es socio de ningun club.
type MembershipState = 'member' | 'left' | 'none';

type BeneficiaryRow = Beneficiary & {
  is_hidden: boolean;
  membership: MembershipState;
  available_points: number;
  latitude?: number | null;
  longitude?: number | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    points?: string;
    from?: string;
    page?: string;
    perPage?: string;
  }>;
};

function fullName(b: Beneficiary) {
  return `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim();
}

function initials(b: Beneficiary) {
  const name = fullName(b);
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function startOfMonth(monthsBack: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
}

// Las etiquetas llegan traducidas desde la página: así la fila no necesita el
// traductor y se puede renderizar sola.
type RowLabels = {
  member: string;
  left: string;
  none: string;
  pointsWith: string;
  pointsWithout: string;
};

function BeneficiaryTableRow({
  beneficiary,
  showPii,
  userIsAdmin,
  hideOrganizationId,
  labels,
}: {
  beneficiary: BeneficiaryRow;
  showPii: boolean;
  userIsAdmin: boolean;
  hideOrganizationId: string | null;
  labels: RowLabels;
}) {
  return (
    <TableRow className={/* c8 ignore next */ beneficiary.is_hidden ? 'opacity-50' : ''}>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet">
            {initials(beneficiary)}
          </span>
          <span>
            <span className="block font-medium">{fullName(beneficiary) || 'N/A'}</span>
            <span
              className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                beneficiary.membership === 'member'
                  ? 'bg-brand-green/10 text-brand-green'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {labels[beneficiary.membership]}
            </span>
          </span>
        </div>
      </TableCell>
      {showPii && (
        <>
          <TableCell className="max-w-[200px] truncate">{beneficiary.email || 'N/A'}</TableCell>
          <TableCell>{beneficiary.phone || 'N/A'}</TableCell>
          <TableCell>{beneficiary.document_id || 'N/A'}</TableCell>
        </>
      )}
      <TableCell className="tabular-nums">
        {beneficiary.available_points.toLocaleString('es-AR')}
      </TableCell>
      <TableCell>
        <span suppressHydrationWarning>
          {formatDateOnly(beneficiary.registration_date, 'es-AR', {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${
            beneficiary.available_points > 0
              ? 'border-brand-green/30 bg-brand-green/10 text-brand-green'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {beneficiary.available_points > 0 ? labels.pointsWith : labels.pointsWithout}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {hideOrganizationId && (
            <HideButton
              beneficiaryId={beneficiary.id}
              organizationId={hideOrganizationId}
              isHidden={/* c8 ignore next */ beneficiary.is_hidden ?? false}
            />
          )}
          {userIsAdmin && (
            <>
              <Button asChild size="icon-sm" variant="outline">
                <Link href={`/dashboard/beneficiary/edit/${beneficiary.id}`}>
                  <Eye className="size-4" />
                </Link>
              </Button>
              <Button asChild size="icon-sm" variant="secondary">
                <Link href={`/dashboard/beneficiary/edit/${beneficiary.id}`}>
                  <Pencil className="size-4" />
                </Link>
              </Button>
              <DeleteModal
                beneficiaryId={beneficiary.id}
                beneficiaryName={fullName(beneficiary) || 'Unnamed Beneficiary'}
              />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default async function BeneficiaryListPage({ searchParams }: PageProps) {
  const [supabase, currentUser, t, tCommon, params] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.beneficiary'),
    getTranslations('Common'),
    searchParams,
  ]);
  const userIsAdmin = isAdmin(currentUser);
  // Los owners solo ven nombre: nada de email, teléfono ni documento (PD-522).
  const showPii = userIsAdmin;
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let rows: BeneficiaryRow[] = [];
  let error = null;

  // Scope to a single org when we have one (always true for non-admins; true for
  // admins only if they explicitly selected one via the org switcher).
  if (orgIdFilter) {
    const result = await supabase
      .from('beneficiary_organization')
      .select(`
        is_hidden,
        is_active,
        available_points,
        beneficiary:beneficiary_id(*, address:address_id(latitude, longitude))
      `)
      .eq('organization_id', orgIdFilter);

    if (result.error) {
      error = result.error;
    } else {
      for (const item of result.data ?? []) {
        const record = item as unknown as Record<string, unknown>;
        const beneficiary = record.beneficiary as
          | (Beneficiary & { address?: { latitude?: number; longitude?: number } | null })
          | null;
        if (!beneficiary) continue;
        rows.push({
          ...beneficiary,
          available_points: (record.available_points as number) ?? 0,
          is_hidden: (record.is_hidden as boolean) ?? false,
          membership: record.is_active === false ? 'left' : 'member',
          latitude: beneficiary.address?.latitude ?? null,
          longitude: beneficiary.address?.longitude ?? null,
        });
      }
    }
  } else {
    // Admin users or no active organization selected - show all beneficiaries.
    // Sin una org de referencia el estado se resuelve sobre todas las membresías:
    // socio si sigue activo en alguna, dado de baja si las dejó todas.
    const result = await supabase
      .from('beneficiary')
      .select('*, address:address_id(latitude, longitude), beneficiary_organization(is_active)');
    error = result.error;
    rows = (result.data ?? []).map((beneficiary) => {
      const b = beneficiary as Beneficiary & {
        address?: { latitude?: number; longitude?: number } | null;
        beneficiary_organization?: { is_active: boolean | null }[] | null;
      };
      const memberships = b.beneficiary_organization ?? [];
      return {
        ...b,
        available_points: 0,
        is_hidden: false,
        membership: memberships.some((m) => m.is_active !== false)
          ? 'member'
          : memberships.length > 0
            ? 'left'
            : 'none',
        latitude: b.address?.latitude ?? null,
        longitude: b.address?.longitude ?? null,
      };
    });
  }

  if (error) {
    return <div>{t('error')}</div>;
  }

  const thisMonth = startOfMonth(0);
  const lastMonth = startOfMonth(1);
  const totalPoints = rows.reduce((sum, r) => sum + r.available_points, 0);

  const stats = {
    total: rows.length,
    active: rows.filter((r) => r.membership === 'member').length,
    withPoints: rows.filter((r) => r.available_points > 0).length,
    averagePoints: rows.length ? Math.round(totalPoints / rows.length) : 0,
    newThisMonth: rows.filter((r) => new Date(r.registration_date) >= thisMonth).length,
    newLastMonth: rows.filter((r) => {
      const date = new Date(r.registration_date);
      return date >= lastMonth && date < thisMonth;
    }).length,
    limit: null as number | null,
  };

  const filters = {
    q: params.q?.trim() ?? '',
    status:
      params.status === 'member' || params.status === 'left' || params.status === 'none'
        ? params.status
        : '',
    points: params.points === 'with' || params.points === 'without' ? params.points : '',
    from: params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
  };

  // ponytail: filtramos en memoria porque el plan tope es 5.000 beneficiarios y
  // la búsqueda cruza campos del join; si crece, mover el where a la consulta.
  const needle = filters.q.toLowerCase();
  const filtered = rows.filter((row) => {
    if (needle) {
      const haystack = (showPii ? [fullName(row), row.email, row.document_id, row.phone] : [fullName(row)])
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (filters.status && row.membership !== filters.status) return false;
    if (filters.points === 'with' && row.available_points <= 0) return false;
    if (filters.points === 'without' && row.available_points > 0) return false;
    if (filters.from && new Date(row.registration_date) < new Date(filters.from)) return false;
    return true;
  });

  const perPage = parsePerPage(params.perPage);
  const totalPages = Math.ceil(filtered.length / perPage);
  const page = parsePage(params.page, totalPages);
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const mapPoints: BeneficiaryPoint[] = rows.flatMap((r) =>
    typeof r.latitude === 'number' && typeof r.longitude === 'number'
      ? [{ latitude: r.latitude, longitude: r.longitude, registrationDate: r.registration_date }]
      : [],
  );

  // Sólo los owners con org activa pueden ocultar beneficiarios.
  const hideOrganizationId = !userIsAdmin && orgIdFilter ? orgIdFilter.toString() : null;
  const rowLabels: RowLabels = {
    member: t('membershipStatus.member'),
    left: t('membershipStatus.left'),
    none: t('membershipStatus.none'),
    pointsWith: t('pointsStatus.with'),
    pointsWithout: t('pointsStatus.without'),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {t('title')}
            <PlanUsageBadge feature="beneficiaries" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="#beneficiarios-por-zona"
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <MapPin className="size-4" />
            {t('viewOnMap')}
          </Link>
          <ExcelExportButton
            filename="beneficiarios.xlsx"
            label={tCommon('export')}
            headers={[
              t('tableHeaders.name'),
              ...(showPii
                ? [t('tableHeaders.email'), t('tableHeaders.phone'), t('tableHeaders.document')]
                : []),
              t('tableHeaders.availablePoints'),
              t('tableHeaders.registrationDate'),
            ]}
            rows={filtered.map((row) => [
              fullName(row),
              ...(showPii ? [row.email, row.phone, row.document_id] : []),
              row.available_points,
              row.registration_date,
            ])}
          />
          {userIsAdmin && (
            <PlanLimitCreateButton
              features={['beneficiaries']}
              createHref="/dashboard/beneficiary/create"
              createLabel={t('newButton')}
            />
          )}
        </div>
      </div>

      <PlanUsageBanner features={['beneficiaries']} />

      <BeneficiaryStats data={stats} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <BeneficiaryFilters values={filters} namesOnly={!showPii} />

          <div className="rounded-xl border bg-card shadow-sm">
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t('showing', { shown: visible.length, total: filtered.length })}
            </p>
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableHeaders.name')}</TableHead>
                  {showPii && (
                    <>
                      <TableHead>{t('tableHeaders.email')}</TableHead>
                      <TableHead>{t('tableHeaders.phone')}</TableHead>
                      <TableHead>{t('tableHeaders.document')}</TableHead>
                    </>
                  )}
                  <TableHead>{t('tableHeaders.availablePoints')}</TableHead>
                  <TableHead>{t('tableHeaders.registrationDate')}</TableHead>
                  <TableHead>{t('tableHeaders.pointsStatus')}</TableHead>
                  <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length > 0 ? (
                  visible.map((beneficiary) => (
                    <BeneficiaryTableRow
                      key={beneficiary.id}
                      beneficiary={beneficiary}
                      showPii={showPii}
                      userIsAdmin={userIsAdmin}
                      hideOrganizationId={hideOrganizationId}
                      labels={rowLabels}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="py-8 text-center" colSpan={showPii ? 8 : 5}>
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination total={filtered.length} page={page} perPage={perPage} />
          </div>
        </div>

        <BeneficiaryHeatmap points={mapPoints} />
      </div>
    </div>
  );
}
