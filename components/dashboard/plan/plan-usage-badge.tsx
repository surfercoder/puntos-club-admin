'use client';

import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLAN_FEATURE_LABELS } from '@/lib/plans/config';
import type { PlanFeatureKey } from '@/types/plan';

interface PlanUsageBadgeProps {
  feature: PlanFeatureKey;
  /** Show feature label before the count (useful when multiple badges are side by side) */
  showLabel?: boolean;
  className?: string;
}

export function PlanUsageBadge({ feature, showLabel, className }: PlanUsageBadgeProps) {
  const { getFeature, isLoading } = usePlanUsage();

  if (isLoading) return null;

  const usage = getFeature(feature);
  if (!usage) return null;

  const { current_usage, limit_value, is_at_limit, should_warn } = usage;

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium tabular-nums',
        is_at_limit
          ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300'
          : should_warn
            ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            : 'border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300',
        className
      )}
    >
      {showLabel && <span className="font-normal">{PLAN_FEATURE_LABELS[feature]}:</span>}
      {current_usage} / {limit_value}
    </Badge>
  );
}
