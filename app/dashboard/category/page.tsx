import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/category/delete-modal';
import ToastHandler from '@/components/dashboard/category/toast-handler';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { getActiveOrgIdFilter } from '@/lib/auth/get-active-org-id';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/types/category';

export default async function CategoryListPage() {
  const [t, tCommon, supabase, currentUser] = await Promise.all([
    getTranslations('Dashboard.category'),
    getTranslations('Common'),
    createClient(),
    getCurrentUser(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let query = supabase.from('category').select('*').order('name');
  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <ToastHandler />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/category/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.description')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((category: Category) => {
                const categoryId = category.id;
                if (!categoryId) {
                  return null;
                }

                return (
                <TableRow key={categoryId}>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>{category.description || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.active ? tCommon('active') : tCommon('inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/category/edit/${categoryId}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteModal 
                        categoryId={categoryId}
                        categoryName={category.name}
                      />
                    </div>
                  </TableCell>
                </TableRow>
                )
              })
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
