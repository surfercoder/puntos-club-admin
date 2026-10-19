"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { grantNotificationCredits } from '@/actions/dashboard/organization_notification_limits/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type NotificationCredit = {
  id: number;
  amount: number;
  source: 'plan' | 'admin' | 'purchase';
  plan: string | null;
  note: string | null;
  created_at: string;
};

interface NotificationCreditsCardProps {
  organizationId: string;
  granted: number;
  used: number;
  credits: NotificationCredit[];
}

/** Saldo de notificaciones de una org: carga manual del superadmin + historial. */
export default function NotificationCreditsCard({ organizationId, granted, used, credits }: NotificationCreditsCardProps) {
  const t = useTranslations('Dashboard.organizationNotificationLimit.credits');
  const locale = useLocale();
  const { refresh } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isInteger(value) || value === 0) {
      toast.error(t('invalidAmount'));
      return;
    }
    startTransition(async () => {
      const result = await grantNotificationCredits(organizationId, value, note);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t('success'));
      setAmount('');
      setNote('');
      refresh();
    });
  };

  const format = (n: number) => n.toLocaleString(locale, { useGrouping: 'always' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm">
          {t('balance', { remaining: format(Math.max(0, granted - used)), granted: format(granted), used: format(used) })}
        </p>

        <form className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="credit-amount">{t('amount')}</Label>
            <Input
              id="credit-amount"
              inputMode="numeric"
              type="number"
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit-note">{t('note')}</Label>
            <Input
              id="credit-note"
              placeholder={t('notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending}>{t('submit')}</Button>
        </form>
        <p className="text-xs text-muted-foreground">{t('help')}</p>

        <ul className="divide-y rounded-md border text-sm">
          {credits.length === 0 && <li className="p-3 text-muted-foreground">{t('empty')}</li>}
          {credits.map((credit) => (
            <li key={credit.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">
                  {t(`source.${credit.source}`)}
                  {credit.plan && ` · ${credit.plan}`}
                </p>
                {credit.note && <p className="text-muted-foreground">{credit.note}</p>}
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {new Date(credit.created_at).toLocaleString(locale, { timeZone: 'America/Argentina/Buenos_Aires' })}
                </p>
              </div>
              <span className={credit.amount < 0 ? 'font-semibold text-destructive' : 'font-semibold text-brand-green'}>
                {credit.amount > 0 ? '+' : ''}{format(credit.amount)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
