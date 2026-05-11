import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/app_user/delete-modal';
import { NewUserButton } from '@/components/dashboard/app_user/new-user-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { Badge } from '@/components/ui/badge';
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
import { isCollaborator } from '@/lib/auth/roles';
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
  const userIsCollaborator = isCollaborator(currentUser);
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

  // Collaborators can only see and manage cashier users
  if (userIsCollaborator) {
    const { data: cashierRole } = await supabase
      .from('user_role')
      .select('id')
      .eq('name', 'cashier')
      .single();
    if (cashierRole) {
      query = query.eq('role_id', cashierRole.id);
    }
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
            {!userIsCollaborator && <PlanUsageBadge feature="collaborators" showLabel />}
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <NewUserButton />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.email')}</TableHead>
              <TableHead>{t('tableHeaders.role')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
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