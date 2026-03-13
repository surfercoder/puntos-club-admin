'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Button } from '@/components/ui/button';
import { PLAN_FEATURE_LABELS, PLAN_DISPLAY_NAMES } from '@/lib/plans/config';
import type { PlanFeatureKey } from '@/types/plan';

interface PlanLimitGuardProps {
  /** Features to check */
  features: PlanFeatureKey[];
  /** Where to redirect the user (typically the list page) */
  backHref: string;
  /**
   * 'any' = block if ANY feature is at limit (default, for single-feature pages)
   * 'all' = block only if ALL features are at limit (for multi-feature pages like users)
   */
  mode?: 'any' | 'all';
  children: React.ReactNode;
}

/**
 * Wraps a create page and blocks access when plan limits are reached.
 * Renders children only if the user is within limits.
 */
export function PlanLimitGuard({ features, backHref, mode = 'any', children }: PlanLimitGuardProps) {
  const t = useTranslations('Dashboard.plan');
  const { summary, isLoading, isAtLimit } = usePlanUsage();

  // While loading (shouldn't happen with server-side initial data), show children
  if (isLoading || !summary) return <>{children}</>;

  const blockedFeatures = features.filter((f) => isAtLimit(f));

  const isBlocked = mode === 'any'
    ? blockedFeatures.length > 0
    : blockedFeatures.length === features.length;

  if (!isBlocked) return <>{children}</>;

  const planName = PLAN_DISPLAY_NAMES[summary.plan];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/40">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <h2 className="text-xl font-semibold">
        {t('limitReachedTitle')}
      </h2>

      <p className="text-muted-foreground max-w-md">
        {t('limitReachedDescription', { plan: planName })}
      </p>

      <ul className="text-sm text-muted-foreground space-y-1">
        {blockedFeatures.map((feature) => {
          const usage = summary.features.find((f) => f.feature === feature);
          return (
            <li key={feature}>
              <strong>{PLAN_FEATURE_LABELS[feature]}</strong>: {usage?.current_usage ?? 0}/{usage?.limit_value ?? 0}
            </li>
          );
        })}
      </ul>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" asChild>
          <Link href={backHref}>{t('goBack')}</Link>
        </Button>
        {summary.plan !== 'pro' && (
          <Button asChild>
            <Link href="/dashboard/settings/plan">{t('upgradePlanButton')}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
