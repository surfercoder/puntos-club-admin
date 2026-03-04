'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, TrendingUp, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getUsageSummaryAction } from '@/actions/dashboard/usage/actions';
import { PLAN_FEATURE_LABELS, PLAN_DISPLAY_NAMES } from '@/lib/plans/config';
import type { FeatureUsage, OrganizationUsageSummary, PlanFeatureKey } from '@/types/plan';

interface PlanUsageBannerProps {
  /** Only show warnings for these specific features (all features by default) */
  features?: PlanFeatureKey[];
  className?: string;
}

function FeatureWarning({ usage }: { usage: FeatureUsage }) {
  const label = PLAN_FEATURE_LABELS[usage.feature];
  const isAtLimit = usage.is_at_limit;

  return (
    <span className="flex items-center gap-1.5 text-sm">
      {isAtLimit ? (
        <XCircle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      )}
      <span>
        <strong>{label}</strong>: {usage.current_usage}/{usage.limit_value}
        {isAtLimit ? ' — límite alcanzado' : ` (${usage.usage_percentage}%)`}
      </span>
    </span>
  );
}

export function PlanUsageBanner({ features, className }: PlanUsageBannerProps) {
  const [summary, setSummary] = useState<OrganizationUsageSummary | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getUsageSummaryAction().then(setSummary).catch(() => null);
  }, []);

  if (!summary || dismissed) return null;

  const warnings = summary.features.filter((f) => {
    if (features && !features.includes(f.feature)) return false;
    return f.should_warn || f.is_at_limit;
  });

  if (warnings.length === 0) return null;

  const hasAtLimit = warnings.some((w) => w.is_at_limit);
  const planName = PLAN_DISPLAY_NAMES[summary.plan];

  return (
    <div
      className={cn(
        'relative rounded-lg border px-4 py-3',
        hasAtLimit
          ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
          : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        className
      )}
      role="alert"
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-3 pr-6">
        <TrendingUp className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="space-y-1.5">
          <p className="font-semibold text-sm">
            {hasAtLimit
              ? `Has alcanzado uno o más límites de tu ${planName}`
              : `Te estás acercando a los límites de tu ${planName}`}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {warnings.map((w) => (
              <FeatureWarning key={w.feature} usage={w} />
            ))}
          </div>

          {summary.plan !== 'pro' && (
            <p className="text-xs mt-2 opacity-80">
              <Link
                href="/dashboard/settings/plan"
                className="underline underline-offset-2 font-medium hover:opacity-100"
              >
                Actualiza tu plan
              </Link>{' '}
              para aumentar estos límites.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
