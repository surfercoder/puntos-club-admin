import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/branch/delete-modal';
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
import type { BranchWithRelations } from '@/types/branch';

export default async function BranchListPage() {
  const [supabase, currentUser, t, tCommon, cookieStore] = await Promise.all([
    createClient(),
    getCurrentUser(),
    getTranslations('Dashboard.branch'),
    getTranslations('Common'),
    cookies(),
  ]);
  const userIsAdmin = isAdmin(currentUser);
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let query = supabase
    .from('branch')
    .select(`
      *,
      organization:organization_id(name),
      address:address_id(street, city)
    `);

  // Only filter by organization for non-admin users
  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t('title')}
            <PlanUsageBadge feature="branches" />
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <PlanLimitCreateButton
          features={['branches']}
          createHref="/dashboard/branch/create"
          createLabel={t('newButton')}
        />
      </div>

      <PlanUsageBanner features={['branches']} />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.phone')}</TableHead>
              <TableHead>{t('tableHeaders.address')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((branch: BranchWithRelations) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.organization?.name || 'N/A'}</TableCell>
                  <TableCell>{branch.phone || 'N/A'}</TableCell>
                  <TableCell>
                    {branch.address
                      ? `${branch.address.street}, ${branch.address.city}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {branch.active ? tCommon('active') : tCommon('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/branch/edit/${branch.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        branchId={branch.id}
                        branchName={branch.name}
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
