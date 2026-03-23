import { getTranslations } from 'next-intl/server';

import { PlanSelector } from '@/components/dashboard/plan/plan-selector';

export default async function PlanSettingsPage() {
  const t = await getTranslations('Dashboard.planSettings');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <PlanSelector />
    </div>
  );
}
