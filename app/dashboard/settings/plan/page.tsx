import { getTranslations } from 'next-intl/server';

import { PlanSelector } from '@/components/dashboard/plan/plan-selector';

export default async function PlanSettingsPage() {
  const t = await getTranslations('Dashboard.planSettings');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <PlanSelector />
    </div>
  );
}
