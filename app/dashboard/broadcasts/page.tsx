import { Megaphone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import { BroadcastForm } from '@/components/dashboard/platform/broadcast-form';
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
import { formatDateTime } from '@/lib/utils';
import type { PlatformBroadcast } from '@/types/platform';

export default async function PlatformBroadcastsPage() {
  const [t, locale, user] = await Promise.all([
    getTranslations('Dashboard.platformBroadcasts'),
    getLocale(),
    getCurrentUser(),
  ]);
  // El proxy deja pasar a owners y collaborators: este page es solo del superadmin.
  if (!isAdmin(user)) notFound();

  const supabase = await createClient();
  const [{ count }, { data: broadcasts }] = await Promise.all([
    supabase.from('push_tokens').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('platform_broadcast').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="size-7 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <section className="rounded-lg border p-4">
        <BroadcastForm deviceCount={count ?? 0} />
      </section>

      <section className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.title')}</TableHead>
              <TableHead>{t('table.body')}</TableHead>
              <TableHead className="text-right">{t('table.sent')}</TableHead>
              <TableHead className="text-right">{t('table.failed')}</TableHead>
              <TableHead>{t('table.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts && broadcasts.length > 0 ? (
              (broadcasts as PlatformBroadcast[]).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="max-w-md whitespace-normal">{b.body}</TableCell>
                  <TableCell className="text-right">{b.sent_count}</TableCell>
                  <TableCell className="text-right">{b.failed_count}</TableCell>
                  <TableCell>{formatDateTime(b.created_at, locale, { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center text-muted-foreground" colSpan={5}>{t('empty')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
