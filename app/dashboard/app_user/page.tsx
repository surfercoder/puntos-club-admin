import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/app_user/delete-modal';
import { NewUserButton } from '@/components/dashboard/app_user/new-user-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { Badge } from '@/components/ui/badge';
import { ListTableHeader } from '@/components/dashboard/shared/list-table-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';

interface AppUserWithOrganization {
  id: string;
  organization_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  organization: {
    name: string;
  };
  role?: {
    name: string;
  } | null;
}

export default async function AppUserListPage() {
  const [t, supabase, currentUser] = await Promise.all([
    getTranslations('Dashboard.appUser'),
    createClient(),
    getCurrentUser(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let query = supabase
    .from('app_user')
    .select(`
      *,
      organization:organization(name),
      role:user_role(name)
    `)
    .order('first_name', { nullsFirst: false });

  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }

  const { data: rawData, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  // Hide the currently logged-in owner from the list
  const data = rawData?.filter(
    (user: AppUserWithOrganization) => !currentUser || user.id !== currentUser.id
  ) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            {t('title')}
            <PlanUsageBadge feature="cashiers" showLabel />
            <PlanUsageBadge feature="collaborators" showLabel />
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <NewUserButton />
      </div>

      <div className="border rounded-lg">
        <Table>
          <ListTableHeader
            columns={[
              { label: t('tableHeaders.name') },
              { label: t('tableHeaders.email') },
              { label: t('tableHeaders.role') },
              { label: t('tableHeaders.organization') },
              { label: t('tableHeaders.actions'), className: 'text-right' },
            ]}
          />
          <TableBody>
            {data && data.length > 0 ? (
              data.map((user: AppUserWithOrganization) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    {user.role?.name === 'cashier' ? (
                      <Badge variant="default">{t('roles.cashier')}</Badge>
                    ) : user.role?.name === 'collaborator' ? (
                      <Badge variant="secondary">{t('roles.collaborator')}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{user.organization?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/app_user/edit/${user.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        appUserId={user.id}
                        appUserName={user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email || 'User'}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={5}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}