import { Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/organization/delete-modal';
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
import type { Organization } from '@/types/organization';

export default async function OrganizationListPage() {
  const supabase = await createClient();
  const t = await getTranslations('Dashboard.organization');
  const tCommon = await getTranslations('Common');

  const { data, error } = await supabase.from('organization').select('*').order('name');

  if (error) {
    return <div>{tCommon('error')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/organization/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.logo')}</TableHead>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              <TableHead>{t('tableHeaders.legalName')}</TableHead>
              <TableHead>{t('tableHeaders.taxId')}</TableHead>
              <TableHead>{t('tableHeaders.createdAt')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((organization: Organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    {organization.logo_url ? (
                      <div className="relative h-10 w-24 overflow-hidden rounded-md bg-muted flex items-center justify-center">
                        <Image
                          alt={`${organization.name} logo`}
                          className="object-contain"
                          height={40}
                          src={organization.logo_url}
                          width={96}
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-24 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/organization/${organization.id}`}
                      className="text-primary hover:text-primary/80 hover:underline"
                    >
                      {organization.name}
                    </Link>
                  </TableCell>
                  <TableCell>{organization.business_name || 'N/A'}</TableCell>
                  <TableCell>{organization.tax_id || 'N/A'}</TableCell>
                  <TableCell>
                    {new Date(organization.creation_date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/organization/edit/${organization.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        organizationId={organization.id}
                        organizationName={organization.name}
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
