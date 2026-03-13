'use client';

import {
  Users,
  Bell,
  UserCheck,
  Store,
  UserCog,
  Gift,
  TrendingUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import {
  PLAN_FEATURE_LABELS,
  PLAN_DISPLAY_NAMES,
  PLAN_FEATURE_ORDER,
} from '@/lib/plans/config';
import type { FeatureUsage, PlanFeatureKey } from '@/types/plan';

const FEATURE_ICONS: Record<PlanFeatureKey, React.ElementType> = {
  beneficiaries:              Users,
  push_notifications_monthly: Bell,
  cashiers:                   UserCheck,
  branches:                   Store,
  collaborators:               UserCog,
  redeemable_products:        Gift,
};

function usageColor(pct: number, isAtLimit: boolean): string {
  if (isAtLimit)  return 'bg-red-500';
  if (pct >= 80)  return 'bg-amber-500';
  if (pct >= 50)  return 'bg-blue-500';
  return 'bg-emerald-500';
}

function textColor(pct: number, isAtLimit: boolean): string {
  if (isAtLimit)  return 'text-red-600 dark:text-red-400';
  if (pct >= 80)  return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

function FeatureRow({ usage }: { usage: FeatureUsage }) {
  const Icon = FEATURE_ICONS[usage.feature];
  const label = PLAN_FEATURE_LABELS[usage.feature];
  const color = usageColor(usage.usage_percentage, usage.is_at_limit);
  const pctText = textColor(usage.usage_percentage, usage.is_at_limit);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <span className={cn('text-xs font-mono shrink-0', pctText)}>
          {usage.current_usage} / {usage.limit_value}
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(100, usage.usage_percentage)}%` }}
          role="progressbar"
          aria-valuenow={usage.current_usage}
          aria-valuemin={0}
          aria-valuemax={usage.limit_value}
          aria-label={label}
        />
      </div>
    </div>
  );
}

interface PlanUsageSummaryProps {
  className?: string;
  compact?: boolean;
}

export function PlanUsageSummary({ className, compact = false }: PlanUsageSummaryProps) {
  const t = useTranslations('Dashboard.plan');
  const { summary, isLoading } = usePlanUsage();

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) return null;

  const orderedFeatures = PLAN_FEATURE_ORDER
    .map((key) => summary.features.find((f) => f.feature === key))
    .filter((f): f is FeatureUsage => Boolean(f));

  const planName = PLAN_DISPLAY_NAMES[summary.plan];
  const anyWarning = summary.features.some((f) => f.should_warn || f.is_at_limit);

  const inner = (
    <div className="space-y-3">
      {orderedFeatures.map((f) => (
        <FeatureRow key={f.feature} usage={f} />
      ))}
    </div>
  );

  if (compact) return <div className={className}>{inner}</div>;

  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{t('usageTitle')}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {planName}
          </span>
        </div>

        {summary.plan !== 'pro' && (
          <Link
            href="/dashboard/settings/plan"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('upgradePlanButton')}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {anyWarning && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs">{t('nearingLimitWarning')}</span>
        </div>
      )}

      <div className="px-5 py-4">{inner}</div>
    </div>
  );
}
