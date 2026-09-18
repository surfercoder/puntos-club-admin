'use client';

import { Building2, Check, Rocket, Star, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  PLAN_FEATURE_ORDER,
  PLAN_ORDER,
  PLAN_PRICES,
  UNLIMITED,
  isQuotaFeature,
  planColor,
} from '@/lib/plans/config';
import type { PlanFeatureKey, PlanType } from '@/types/plan';

/** Icono por plan — la única parte que no sale de la base. */
const PLAN_ICONS: Record<PlanType, React.ComponentType<{ className?: string }>> = {
  trial:      Star,
  advance:    Zap,
  pro:        Rocket,
  enterprise: Building2,
};

const selectedMap: Record<string, string> = {
  green:  'border-brand-green bg-brand-green/10',
  blue:   'border-brand-blue bg-brand-blue/10',
  pink:   'border-brand-pink bg-brand-pink/10',
  violet: 'border-brand-violet bg-brand-violet/10',
};

const iconColorMap: Record<string, string> = {
  green:  'text-brand-green bg-brand-green/15',
  blue:   'text-brand-blue bg-brand-blue/15',
  pink:   'text-brand-pink bg-brand-pink/15',
  violet: 'text-brand-violet bg-brand-violet/15',
};

const badgeColorMap: Record<string, string> = {
  green:  'bg-brand-green/15 text-brand-green',
  blue:   'bg-brand-blue/15 text-brand-blue',
  pink:   'bg-brand-pink/15 text-brand-pink',
  violet: 'bg-brand-violet/15 text-brand-violet',
};

const currentPlanBadgeMap: Record<string, string> = {
  green:  'bg-brand-green text-white',
  blue:   'bg-brand-blue text-white',
  pink:   'bg-brand-pink text-white',
  violet: 'bg-brand-violet text-white',
};

export type PlanLimitsByPlan = Record<PlanType, Record<PlanFeatureKey, number>>;

function FeatureValue({
  feature,
  value,
  unlimitedLabel,
}: {
  feature: PlanFeatureKey;
  value: number | undefined;
  unlimitedLabel: string;
}) {
  const locale = useLocale();

  if (!isQuotaFeature(feature)) {
    return value && value > 0 ? (
      <Check className="size-3.5 text-brand-green" />
    ) : (
      <span className="text-muted-foreground text-[10px]">-</span>
    );
  }
  return (
    <span className="text-[11px] font-medium">
      {value === UNLIMITED ? unlimitedLabel : (value ?? 0).toLocaleString(locale)}
    </span>
  );
}

interface PlanCardProps {
  plan: PlanType;
  limits: Record<PlanFeatureKey, number> | undefined;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  /** Etiqueta "Popular" — se muestra en el plan que la reciba */
  popular?: boolean;
}

function PlanCard({ plan, limits, isSelected, isCurrent, onSelect, popular }: PlanCardProps) {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const Icon = PLAN_ICONS[plan];
  const color = planColor(plan);
  const price = PLAN_PRICES[plan];

  const priceLabel =
    price === null ? t('customPriceLabel') : price === 0 ? t('freePriceLabel') : `$${price}`;
  const priceNote =
    price === null ? undefined : price === 0 ? t('trialPriceNote') : t('paidPriceNote');

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-lg border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer',
        isSelected ? selectedMap[color] : 'border-border hover:border-muted-foreground/30'
      )}
    >
      {isCurrent && (
        <span
          className={cn(
            'absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            currentPlanBadgeMap[color]
          )}
        >
          {tSettings('currentPlan')}
        </span>
      )}
      {!isCurrent && popular && (
        <span
          className={cn(
            'absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            badgeColorMap[color]
          )}
        >
          {t('popularBadge')}
        </span>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className={cn('rounded-md p-1.5', iconColorMap[color])}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{t(`${plan}Plan`)}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-foreground">{priceLabel}</span>
            {priceNote && <span className="text-[10px] text-muted-foreground">{priceNote}</span>}
          </div>
        </div>
      </div>

      <ul className="space-y-1 flex-1">
        {PLAN_FEATURE_ORDER.map((feature) => (
          <li key={feature} className="flex items-center justify-between gap-1">
            <span className="text-[11px] text-muted-foreground">{t(`features.${feature}`)}</span>
            <FeatureValue
              feature={feature}
              value={limits?.[feature]}
              unlimitedLabel={t('unlimited')}
            />
          </li>
        ))}
      </ul>

      {isSelected && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand-green">
          <Check className="size-3.5" />
          {isCurrent ? tSettings('currentPlan') : t('selectedPlan')}
        </div>
      )}
    </button>
  );
}

interface PlanCardsProps {
  limits: PlanLimitsByPlan | null;
  selected: PlanType | null;
  currentPlan?: PlanType | null;
  onSelect: (plan: PlanType) => void;
}

/**
 * Las cuatro tarjetas de planes. Valores y features salen de `plan_limits`:
 * cambiar un plan es cambiar la base, no este archivo.
 */
export function PlanCards({ limits, selected, currentPlan = null, onSelect }: PlanCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((plan) => (
        <PlanCard
          key={plan}
          plan={plan}
          limits={limits?.[plan]}
          isSelected={selected === plan}
          isCurrent={currentPlan === plan}
          onSelect={() => onSelect(plan)}
          popular={plan === 'advance'}
        />
      ))}
    </div>
  );
}
