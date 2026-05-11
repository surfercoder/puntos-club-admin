import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/address/delete-modal';
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
import type { Address } from '@/types/address';

export default async function AddressListPage() {
  const [t, supabase, currentUser] = await Promise.all([
    getTranslations('Dashboard.address'),
    createClient(),
    getCurrentUser(),
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  let query = supabase.from('address').select('*').order('street');
  if (orgIdFilter) {
    query = query.eq('organization_id', orgIdFilter);
  }

  const { data, error } = await query;

  if (error) {
    return <div>{t('error')}</div>;
  }

  return (
    <div className="space-y-6">    
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/address/create">{t('newButton')}</Link>
        </Button>
      </div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.street')}</TableHead>
              <TableHead>{t('tableHeaders.number')}</TableHead>
              <TableHead>{t('tableHeaders.city')}</TableHead>
              <TableHead>{t('tableHeaders.state')}</TableHead>
              <TableHead>{t('tableHeaders.zipCode')}</TableHead>
              <TableHead>{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((address: Address) => (
                <TableRow key={address.id}>
                  <TableCell>{address.street}</TableCell>
                  <TableCell>{address.number}</TableCell>
                  <TableCell>{address.city}</TableCell>
                  <TableCell>{address.state}</TableCell>
                  <TableCell>{address.zip_code}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/address/edit/${address.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteModal id={Number(address.id)} />
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
