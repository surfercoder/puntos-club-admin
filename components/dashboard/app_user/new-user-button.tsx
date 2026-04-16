'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';

export function NewUserButton() {
  const t = useTranslations('Dashboard.appUser');
  const { isAtLimit, isLoading } = usePlanUsage();

  const allAtLimit = !isLoading && isAtLimit('cashiers') && isAtLimit('collaborators');

  if (allAtLimit) {
    return (
      <Button disabled>
        {t('newButton')}
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link href="/dashboard/app_user/create">{t('newButton')}</Link>
    </Button>
  );
}
