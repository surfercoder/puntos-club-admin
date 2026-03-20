import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/push_tokens_crud/delete-modal';
import ToastHandler from '@/components/dashboard/push_tokens_crud/toast-handler';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { isAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PushTokensListPage() {
  const t = await getTranslations('Dashboard.pushTokensCrud');
  const currentUser = await getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const supabase = userIsAdmin ? createAdminClient() : await createClient();

  const { data, error } = await supabase
    .from('push_tokens')
    .select('*, beneficiary:beneficiary_id(first_name, last_name, email)')
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
          <Link href="/dashboard/push_tokens/create">{t('newButton')}</Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.beneficiary')}</TableHead>
              <TableHead>{t('tableHeaders.platform')}</TableHead>
              <TableHead>{t('tableHeaders.deviceId')}</TableHead>
              <TableHead>{t('tableHeaders.token')}</TableHead>
              <TableHead>{t('tableHeaders.active')}</TableHead>
              <TableHead>{t('tableHeaders.created')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((token) => {
                const beneficiary = Array.isArray(token.beneficiary) ? token.beneficiary[0] : token.beneficiary;
                const beneficiaryName = beneficiary
                  ? `${beneficiary.first_name || ''} ${beneficiary.last_name || ''}`.trim() || beneficiary.email
                  : 'N/A';

                return (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{beneficiaryName}</TableCell>
                    <TableCell>{token.platform || 'N/A'}</TableCell>
                    <TableCell>{token.device_id || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{token.expo_push_token}</TableCell>
                    <TableCell>
                      <Badge variant={token.is_active ? 'default' : 'secondary'}>
                        {token.is_active ? t('statusActive') : t('statusInactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(token.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/push_tokens/edit/${token.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteModal tokenId={String(token.id)} tokenLabel={beneficiaryName} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
