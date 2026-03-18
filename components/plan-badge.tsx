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

const planConfig: Record<PlanType, { icon: React.ElementType; colorClass: string; dotClass: string }> = {
  trial: {
    icon: Star,
    colorClass: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60',
    dotClass: 'bg-emerald-500',
  },
  advance: {
    icon: Zap,
    colorClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60',
    dotClass: 'bg-blue-500',
  },
  pro: {
    icon: Rocket,
    colorClass: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60',
    dotClass: 'bg-purple-500',
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
