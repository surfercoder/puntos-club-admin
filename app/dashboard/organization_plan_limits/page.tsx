import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/organization_plan_limits/delete-modal';
import ToastHandler from '@/components/dashboard/organization_plan_limits/toast-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/server';

export default async function OrganizationPlanLimitsListPage() {
  const t = await getTranslations('Dashboard.orgPlanLimits');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_plan_limits')
    .select('*, organization:organization_id(name)')
    .order('organization_id')
    .order('feature');

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
          <Link href="/dashboard/organization_plan_limits/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.plan')}</TableHead>
              <TableHead>{t('tableHeaders.feature')}</TableHead>
              <TableHead>{t('tableHeaders.limit')}</TableHead>
              <TableHead>{t('tableHeaders.warning')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((limit) => (
                <TableRow key={limit.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(limit.organization) ? limit.organization[0]?.name : limit.organization?.name || 'N/A'}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{limit.plan}</Badge></TableCell>
                  <TableCell>{limit.feature}</TableCell>
                  <TableCell>{limit.limit_value}</TableCell>
                  <TableCell>{(limit.warning_threshold * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/organization_plan_limits/edit/${limit.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal limitId={String(limit.id)} limitLabel={`${limit.feature}`} />
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
