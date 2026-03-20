import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/subscription/delete-modal';
import ToastHandler from '@/components/dashboard/subscription/toast-handler';
import { Badge } from '@/components/ui/badge';
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

export default async function SubscriptionListPage() {
  const t = await getTranslations('Dashboard.subscription');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription')
    .select('*, organization:organization_id(name)')
    .order('created_at', { ascending: false });

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
          <Link href="/dashboard/subscription/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.organization')}</TableHead>
              <TableHead>{t('tableHeaders.plan')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.payerEmail')}</TableHead>
              <TableHead>{t('tableHeaders.amount')}</TableHead>
              <TableHead>{t('tableHeaders.created')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">
                    {Array.isArray(sub.organization) ? sub.organization[0]?.name : sub.organization?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      sub.status === 'authorized' ? 'default' :
                      sub.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }>
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub.payer_email}</TableCell>
                  <TableCell>{sub.amount} {sub.currency}</TableCell>
                  <TableCell>{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/subscription/edit/${sub.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteModal subscriptionId={String(sub.id)} subscriptionLabel={sub.mp_preapproval_id} />
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
