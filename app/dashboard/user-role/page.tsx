import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/user_role_crud/delete-modal';
import ToastHandler from '@/components/dashboard/user_role_crud/toast-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

export default async function UserRoleListPage() {
  const t = await getTranslations('UserRole');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_role')
    .select('*')
    .order('display_name');

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <ToastHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/user-role/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.roleType')}</TableHead>
              <TableHead>{t('tableHeaders.displayName')}</TableHead>
              <TableHead>{t('tableHeaders.description')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <Badge variant={
                      role.name === 'admin' ? 'destructive' :
                      role.name === 'owner' ? 'secondary' :
                      'outline'
                    }>
                      {role.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{role.display_name}</TableCell>
                  <TableCell className="max-w-md">{role.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/user-role/edit/${role.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal roleId={String(role.id)} roleName={role.display_name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={4}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
