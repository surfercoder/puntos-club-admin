import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
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
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { Beneficiary } from '@/types/beneficiary';

export default async function BeneficiaryListPage() {
  const [supabase, currentUser, t, _tCommon, cookieStore] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.beneficiary'),
    getTranslations('Common'),
    cookies(),
  ]);
  const userIsAdmin = isAdmin(currentUser);
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  type BeneficiaryWithHidden = Beneficiary & { is_hidden?: boolean; available_points?: number };
  let data: BeneficiaryWithHidden[] | null = null;
  let error = null;

  // Only filter by organization for non-admin users
  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    // Filter beneficiaries by organization, include is_hidden status
    const result = await supabase
      .from('beneficiary_organization')
      .select(`
        is_hidden,
        available_points,
        beneficiary:beneficiary_id(*)
      `)
      .eq('organization_id', activeOrgIdNumber);

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
                    {new Date(beneficiary.registration_date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!userIsAdmin && activeOrgIdNumber && (
                        <HideButton
                          beneficiaryId={beneficiary.id}
                          organizationId={activeOrgIdNumber.toString()}
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
