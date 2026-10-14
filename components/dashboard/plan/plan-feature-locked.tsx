import { Lock } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import type { PlanFlagKey } from '@/types/plan';

/**
 * Lo que ve una org cuyo plan no incluye `feature` (flag en 0 en plan_limits).
 * Server component: quien lo usa ya resolvió el flag con hasPlanFeature.
 */
export async function PlanFeatureLocked({ feature }: { feature: PlanFlagKey }) {
  const [t, tStep] = await Promise.all([
    getTranslations('Dashboard.plan'),
    getTranslations('Onboarding.step3'),
  ]);
  const label = tStep(`features.${feature}`);

  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border bg-card px-4 py-10 text-center shadow-sm">
      <div className="rounded-full bg-muted p-3">
        <Lock className="size-6 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold">{t('featureLockedTitle', { feature: label })}</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {t('featureLockedDescription', { feature: label })}
      </p>
      <Button asChild>
        <Link href="/dashboard/settings/plan">{t('upgradePlanButton')}</Link>
      </Button>
    </section>
  );
}
