import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/app_user_organization/delete-modal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

interface AppUserOrganizationWithRelations {
  id: string;
  app_user_id: string;
  organization_id: string;
  is_active: boolean;
  app_user: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  organization: {
    name: string;
  };
}

export default async function AppUserOrganizationListPage() {
  const t = await getTranslations('Dashboard.appUserOrganization');
  const tCommon = await getTranslations('Common');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('app_user_organization')
    .select(`
      *,
      app_user:app_user_id(first_name, last_name, email),
      organization:organization_id(name)
    `)
    .order('id', { ascending: false });

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/app_user_organization/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.user')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((row: AppUserOrganizationWithRelations) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.app_user?.first_name || row.app_user?.last_name
                      ? `${row.app_user.first_name || ''} ${row.app_user.last_name || ''}`.trim()
                      : row.app_user?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{row.organization?.name || 'N/A'}</TableCell>
                  <TableCell>{row.is_active ? tCommon('active') : tCommon('inactive')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/app_user_organization/edit/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        appUserOrganizationId={row.id}
                        appUserOrganizationDescription={`${row.app_user?.email || 'User'} - ${row.organization?.name || 'Org'}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={4}>
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
