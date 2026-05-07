import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/beneficiary/delete-modal';
import { HideButton } from '@/components/dashboard/beneficiary/hide-button';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
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
import { formatDateOnly } from '@/lib/utils';
import type { Beneficiary } from '@/types/beneficiary';

export default async function BeneficiaryListPage() {
  const [supabase, currentUser, t, _tCommon] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.beneficiary'),
    getTranslations('Common'),
  ]);
  const userIsAdmin = isAdmin(currentUser);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  type BeneficiaryWithHidden = Beneficiary & { is_hidden?: boolean; available_points?: number };
  let data: BeneficiaryWithHidden[] | null = null;
  let error = null;

  // Scope to a single org when we have one (always true for non-admins; true for
  // admins only if they explicitly selected one via the org switcher).
  if (orgIdFilter) {
    // Filter beneficiaries by organization, include is_hidden status
    const result = await supabase
      .from('beneficiary_organization')
      .select(`
        is_hidden,
        available_points,
        beneficiary:beneficiary_id(*)
      `)
      .eq('organization_id', orgIdFilter);

    if (result.error) {
      error = result.error;
    } else {
      // Extract beneficiaries from the join result, attach is_hidden and org-specific points
      const mapped: BeneficiaryWithHidden[] = [];
      for (const item of result.data ?? []) {
        const b = item.beneficiary as unknown as Beneficiary | null;
        if (b) {
          mapped.push({
            ...b,
            available_points: (item as unknown as Record<string, unknown>).available_points as number ?? 0,
            is_hidden: (item as unknown as Record<string, unknown>).is_hidden as boolean ?? false,
          });
        }
      }
      data = mapped;
    }
  } else {
    // Admin users or no active organization selected - show all beneficiaries
    const result = await supabase.from('beneficiary').select('*');
    data = result.data;
    error = result.error;
  }

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t('title')}
            <PlanUsageBadge feature="beneficiaries" />
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {userIsAdmin && (
          <PlanLimitCreateButton
            features={['beneficiaries']}
            createHref="/dashboard/beneficiary/create"
            createLabel={t('newButton')}
          />
        )}
      </div>

      <PlanUsageBanner features={['beneficiaries']} />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.email')}</TableHead>
              <TableHead>{t('tableHeaders.phone')}</TableHead>
              <TableHead>{t('tableHeaders.document')}</TableHead>
              <TableHead>{t('tableHeaders.availablePoints')}</TableHead>
              <TableHead>{t('tableHeaders.registrationDate')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((beneficiary: BeneficiaryWithHidden) => (
                <TableRow key={beneficiary.id} className={/* c8 ignore next */ beneficiary.is_hidden ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    {beneficiary.first_name || beneficiary.last_name
                      ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{beneficiary.email || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.phone || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.document_id || 'N/A'}</TableCell>
                  <TableCell>{beneficiary.available_points ?? '-'}</TableCell>
                  <TableCell>
                    <span suppressHydrationWarning>{formatDateOnly(beneficiary.registration_date, 'es-AR', { timeZone: 'UTC' })}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!userIsAdmin && orgIdFilter && (
                        <HideButton
                          beneficiaryId={beneficiary.id}
                          organizationId={orgIdFilter.toString()}
                          isHidden={/* c8 ignore next */ beneficiary.is_hidden ?? false}
                        />
                      )}
                      {userIsAdmin && (
                        <>
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/dashboard/beneficiary/edit/${beneficiary.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteModal
                            beneficiaryId={beneficiary.id}
                            beneficiaryName={
                              beneficiary.first_name || beneficiary.last_name
                                ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim()
                                : 'Unnamed Beneficiary'
                            }
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
