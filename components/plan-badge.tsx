'use client';

import { Star, Zap, Rocket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { cn } from '@/lib/utils';
import type { PlanType } from '@/types/plan';

const planConfig: Record<PlanType, { icon: React.ComponentType<{ className?: string }>; colorClass: string; dotClass: string }> = {
  trial: {
    icon: Star,
    colorClass: 'bg-brand-green/15 text-brand-green hover:bg-brand-green/25',
    dotClass: 'bg-brand-green',
  },
  advance: {
    icon: Zap,
    colorClass: 'bg-brand-blue/15 text-brand-blue hover:bg-brand-blue/25',
    dotClass: 'bg-brand-blue',
  },
  pro: {
    icon: Rocket,
    colorClass: 'bg-brand-pink/15 text-brand-pink hover:bg-brand-pink/25',
    dotClass: 'bg-brand-pink',
  },
};

const planTranslationKey: Record<PlanType, string> = {
  trial: 'planTrial',
  advance: 'planAdvance',
  pro: 'planPro',
};

export function PlanBadge() {
  const { plan, isLoading } = usePlanUsage();
  const { state } = useSidebar();
  const t = useTranslations('Navigation');
  const isCollapsed = state === 'collapsed';

  if (isLoading || !plan) return null;

  const config = planConfig[plan];
  const Icon = config.icon;
  const label = t(planTranslationKey[plan]);

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/dashboard/settings/plan"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors mx-auto',
              config.colorClass,
            )}
          >
            <Icon className="size-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{t('managePlan')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href="/dashboard/settings/plan" className="block px-2">
      <Badge
        className={cn(
          'w-full justify-start gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-0',
          config.colorClass,
        )}
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </Badge>
    </Link>
  );
}
