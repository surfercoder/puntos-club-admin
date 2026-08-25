import { Fragment } from 'react';

import { BarChart3, Bell, ChevronDown, ChevronUp, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import DeleteModal from '@/components/dashboard/notifications/delete-modal';
import { NotificationDetailRow } from '@/components/dashboard/notifications/notification-detail-row';
import { NotificationFilters } from '@/components/dashboard/notifications/notification-filters';
import { NotificationStats } from '@/components/dashboard/notifications/notification-stats';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { TablePagination } from '@/components/dashboard/shared/table-pagination';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getUsageSummaryAction } from '@/actions/dashboard/usage/actions';
import { createClient } from '@/lib/supabase/server';
import { NOTIFICATION_STATUSES, formatDateOnly, parsePage, parsePerPage } from '@/lib/utils';
import type { PushNotification, PushNotificationStatus } from '@/types/push_notification';

const NUMBER_FORMATTER = new Intl.NumberFormat('es-AR');

const STATUS_STYLES: Record<string, string> = {
  sent: 'bg-brand-blue/10 text-brand-blue',
  sending: 'bg-brand-orange/10 text-brand-orange',
  draft: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

type Creator = { first_name?: string; last_name?: string; email?: string };
type NotificationRow = PushNotification & { creator?: Creator };

interface PageProps {
  searchParams: Promise<{
    q?: string; status?: string; from?: string; to?: string;
    open?: string; page?: string; perPage?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const [supabase, t, tCommon, params, usage] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.notifications'),
    getTranslations('Common'),
    searchParams,
    getUsageSummaryAction(),
  ]);

  const filters = {
    q: params.q?.trim() ?? '',
    status: NOTIFICATION_STATUSES.find((s) => s === params.status) ?? '',
    from: params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
    to: params.to?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? '',
  };

  let query = supabase
    .from('push_notifications')
    .select(`
      *,
      creator:app_user!push_notifications_created_by_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.from) {
    query = query.gte('created_at', filters.from);
  }
  if (filters.to) {
    query = query.lte('created_at', `${filters.to}T23:59:59.999`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error('Failed to fetch notifications');
  }

  const needle = filters.q.toLowerCase();
  // Una sola pasada: filtramos y enriquecemos en el mismo recorrido.
  const rows = ((data ?? []) as NotificationRow[]).flatMap((notification) => {
    if (needle && !`${notification.title} ${notification.body}`.toLowerCase().includes(needle)) {
      return [];
    }
    return [{
      ...notification,
      // Expo devuelve un error por token fallido, así que lo entregado es lo
      // enviado menos lo fallido. Las aperturas todavía no se registran.
      delivered: Math.max(0, (notification.sent_count ?? 0) - (notification.failed_count ?? 0)),
      creatorName: notification.creator
        ? `${notification.creator.first_name || ''} ${notification.creator.last_name || ''}`.trim()
          || notification.creator.email
        : null,
    }];
  });

  const perPage = parsePerPage(params.perPage);
  const page = parsePage(params.page, Math.ceil(rows.length / perPage));
  const visible = rows.slice((page - 1) * perPage, page * perPage);

  const monthlyUsage = usage?.features.find((f) => f.feature === 'push_notifications_monthly');

  const stats = {
    sent: rows.reduce((sum, r) => sum + (r.sent_count ?? 0), 0),
    delivered: rows.reduce((sum, r) => sum + r.delivered, 0),
    failed: rows.reduce((sum, r) => sum + (r.failed_count ?? 0), 0),
    remaining: monthlyUsage
      ? Math.max(0, monthlyUsage.limit_value - monthlyUsage.current_usage)
      : null,
    monthlyLimit: monthlyUsage?.limit_value ?? null,
  };

  const openId = params.open ?? '';
  const queryFor = (id: string) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) next.set(key, value);
    }
    if (params.page) next.set('page', params.page);
    if (params.perPage) next.set('perPage', params.perPage);
    if (openId !== id) next.set('open', id);
    const search = next.toString();
    return `/dashboard/notifications${search ? `?${search}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Megaphone className="size-7 text-brand-violet" />
            {t('title')}
            <PlanUsageBadge feature="push_notifications_monthly" />
          </h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            <BarChart3 className="size-4" />
            {t('viewStats')}
          </Link>
          <PlanLimitCreateButton
            features={['push_notifications_monthly']}
            createHref="/dashboard/notifications/create"
            createLabel={t('newButton')}
          />
        </div>
      </div>

      <PlanUsageBanner features={['push_notifications_monthly']} />

      <NotificationStats data={stats} />

      <NotificationFilters values={filters} />

      <div className="rounded-xl border bg-card shadow-sm">
        <Table className="text-[13px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.message')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.sent')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.delivered')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.failed')}</TableHead>
              <TableHead>{tCommon('createdBy')}</TableHead>
              <TableHead>{tCommon('createdAt')}</TableHead>
              <TableHead className="text-right">{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length > 0 ? (
              visible.map((notification) => {
                const isOpen = String(notification.id) === openId;
                return (
                  <Fragment key={notification.id}>
                    <TableRow>
                      <TableCell className="max-w-[180px]">
                        <span className="flex items-center gap-2">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
                            <Megaphone className="size-4" />
                          </span>
                          <span className="truncate font-medium">{notification.title}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{notification.body}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[notification.status] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {t(`status.${notification.status as PushNotificationStatus}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {NUMBER_FORMATTER.format(notification.sent_count ?? 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-brand-green">
                        {NUMBER_FORMATTER.format(notification.delivered)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-brand-pink">
                        {NUMBER_FORMATTER.format(notification.failed_count ?? 0)}
                      </TableCell>
                      <TableCell>{notification.creatorName ?? 'N/A'}</TableCell>
                      <TableCell>
                        <span suppressHydrationWarning>
                          {formatDateOnly(notification.created_at, 'es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild size="icon-sm" variant="outline">
                            <Link
                              href={queryFor(String(notification.id))}
                              aria-label={isOpen ? t('collapse') : t('expand')}
                              scroll={false}
                            >
                              {isOpen ? (
                                <ChevronUp className="size-4" />
                              ) : (
                                <ChevronDown className="size-4" />
                              )}
                            </Link>
                          </Button>
                          <DeleteModal
                            notificationId={notification.id}
                            notificationTitle={notification.title}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={9} className="p-3">
                          <NotificationDetailRow
                            data={{
                              sent: notification.sent_count ?? 0,
                              delivered: notification.delivered,
                              failed: notification.failed_count ?? 0,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell className="py-10 text-center" colSpan={9}>
                  <div className="flex flex-col items-center gap-2">
                    <Bell className="size-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('empty')}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/notifications/create">{t('emptyAction')}</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <p className="text-xs text-muted-foreground">
            {t('showing', { shown: visible.length, total: rows.length })}
          </p>
          <TablePagination total={rows.length} page={page} perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
