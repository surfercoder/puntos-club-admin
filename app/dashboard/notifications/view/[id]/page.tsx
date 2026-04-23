import { ArrowLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/server';

export default async function ViewNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const [supabase, t, tForm, tCommon, { id }] = await Promise.all([
    createClient(),
    getTranslations('Dashboard.notifications'),
    getTranslations('Dashboard.notifications.form'),
    getTranslations('Common'),
    params,
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return notFound();
  }

  const { data: notification, error } = await supabase
    .from('push_notifications')
    .select(`
      *,
      creator:app_user!push_notifications_created_by_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error || !notification) {
    notFound();
  }

  const creator = notification.creator as { first_name: string; last_name: string; email: string } | null;
  const creatorName = creator
    ? (`${creator.first_name} ${creator.last_name}`.trim() || creator.email)
    : '';

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    sent: 'default',
    sending: 'outline',
    draft: 'secondary',
    failed: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/notifications">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('viewPage.title')}</h1>
          <p className="text-muted-foreground">{t('viewPage.description')}</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="space-y-4 border rounded-lg p-6">
          <div className="space-y-2">
            <Label>{tForm('titleLabel')}</Label>
            <Input
              value={notification.title}
              disabled
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label>{tForm('messageLabel')}</Label>
            <Textarea
              value={notification.body}
              disabled
              readOnly
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="bg-muted/50 border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 text-sm min-w-0">
                <p className="font-semibold text-foreground mb-1">{tForm('preview')}</p>
                <div className="bg-background rounded-lg p-3 shadow-sm border min-w-0">
                  <p className="font-semibold text-sm mb-1 whitespace-pre-wrap break-words">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {notification.body}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
            <div>
              <p className="text-muted-foreground">{t('tableHeaders.status')}</p>
              <Badge variant={statusVariants[notification.status] ?? 'secondary'} className="mt-1">
                {notification.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">{tCommon('createdBy')}</p>
              <p className="font-medium mt-1">{creatorName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('tableHeaders.sent')}</p>
              <p className="font-medium mt-1">{notification.sent_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('tableHeaders.failed')}</p>
              <p className="font-medium mt-1">{notification.failed_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{tCommon('createdAt')}</p>
              <p className="font-medium mt-1">{new Date(notification.created_at).toLocaleString()}</p>
            </div>
            {notification.sent_at && (
              <div>
                <p className="text-muted-foreground">{tCommon('sentAt')}</p>
                <p className="font-medium mt-1">{new Date(notification.sent_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
