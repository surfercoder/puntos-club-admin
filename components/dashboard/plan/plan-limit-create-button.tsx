'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import type { PlanFeatureKey } from '@/types/plan';

interface PlanLimitCreateButtonProps {
  features: PlanFeatureKey[];
  createHref: string;
  createLabel: string;
  /**
   * 'any' = disable when ANY feature is at limit (default, for single-feature pages)
   * 'all' = disable only when ALL features are at limit (for multi-feature pages like users)
   */
  disableMode?: 'any' | 'all';
}

export function PlanLimitCreateButton({
  features,
  createHref,
  createLabel,
  disableMode = 'any',
}: PlanLimitCreateButtonProps) {
  const { summary, isLoading, isAtLimit } = usePlanUsage();

  const isDisabled =
    !isLoading &&
    summary !== null &&
    features.length > 0 &&
    (disableMode === 'any'
      ? features.some((f) => isAtLimit(f))
      : features.every((f) => isAtLimit(f)));

  if (isDisabled) {
    return <Button disabled>{createLabel}</Button>;
  }

  return (
    <Button asChild>
      <Link href={createHref}>{createLabel}</Link>
    </Button>
  );
}
