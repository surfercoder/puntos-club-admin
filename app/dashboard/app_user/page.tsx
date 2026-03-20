import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/app_user/delete-modal';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
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

interface AppUserWithOrganization {
  id: string;
  organization_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  username?: string | null;
  password?: string | null;
  active: boolean;
  organization: {
    name: string;
  };
  role?: {
    name: string;
  } | null;
}

export default async function AppUserListPage() {
  const [t, tCommon, supabase, currentUser, cookieStore] = await Promise.all([
    getTranslations('Dashboard.appUser'),
    getTranslations('Common'),
    createClient(),
    getCurrentUser(),
    cookies(),
  ]);
  const userIsAdmin = isAdmin(currentUser);
  const activeOrgId = cookieStore.get('active_org_id')?.value;
  const activeOrgIdNumber = activeOrgId ? Number(activeOrgId) : null;

  let query = supabase
    .from('app_user')
    .select(`
      *,
      organization:organization(name),
      role:user_role(name)
    `)
    .order('first_name', { nullsFirst: false });

  if (!userIsAdmin && activeOrgIdNumber && !Number.isNaN(activeOrgIdNumber)) {
    query = query.eq('organization_id', activeOrgIdNumber);
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {t('title')}
            <PlanUsageBadge feature="cashiers" showLabel />
            <PlanUsageBadge feature="collaborators" showLabel />
          </h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/app_user/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.email')}</TableHead>
              <TableHead>{t('tableHeaders.username')}</TableHead>
              <TableHead>{t('tableHeaders.role')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
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
                  <TableCell>{user.username || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="capitalize">{user.role?.name || 'N/A'}</span>
                  </TableCell>
                  <TableCell>{user.organization?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? tCommon('active') : tCommon('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/app_user/edit/${user.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        appUserId={user.id}
                        appUserName={user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || user.email || 'User'}
                      />
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