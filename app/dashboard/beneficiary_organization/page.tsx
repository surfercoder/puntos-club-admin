import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/beneficiary_organization/delete-modal';
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

interface BeneficiaryOrganizationWithRelations {
  id: string;
  beneficiary_id: string;
  organization_id: string;
  available_points: number;
  total_points_earned: number;
  total_points_redeemed: number;
  joined_date: string;
  is_active: boolean | null;
  beneficiary: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
  organization: {
    name: string;
  };
}

export default async function BeneficiaryOrganizationListPage() {
  const t = await getTranslations('Dashboard.beneficiaryOrganization');
  const tCommon = await getTranslations('Common');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('beneficiary_organization')
    .select(`
      *,
      beneficiary:beneficiary_id(first_name, last_name, email),
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
          <Link href="/dashboard/beneficiary_organization/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.available')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.earned')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.redeemed')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((row: BeneficiaryOrganizationWithRelations) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.beneficiary?.first_name || row.beneficiary?.last_name
                      ? `${row.beneficiary.first_name || ''} ${row.beneficiary.last_name || ''}`.trim()
                      : row.beneficiary?.email || 'N/A'}
                  </TableCell>
                  <TableCell>{row.organization?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">{row.available_points}</TableCell>
                  <TableCell className="text-right">{row.total_points_earned}</TableCell>
                  <TableCell className="text-right">{row.total_points_redeemed}</TableCell>
                  <TableCell>{row.is_active === false ? tCommon('inactive') : tCommon('active')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/beneficiary_organization/edit/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal
                        beneficiaryOrganizationId={row.id}
                        beneficiaryOrganizationDescription={`${row.beneficiary?.email || 'Beneficiary'} - ${row.organization?.name || 'Org'}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-4" colSpan={7}>
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
