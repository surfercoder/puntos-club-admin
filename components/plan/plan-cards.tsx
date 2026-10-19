'use client';

import {
  ArrowRight,
  Bell,
  Check,
  Crown,
  Gift,
  Lock,
  MapPinned,
  Megaphone,
  Star,
  Store,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Clubi } from '@/components/dashboard/home/clubi';
import { cn } from '@/lib/utils';
import {
  PLAN_CARD_FEATURES,
  PLAN_CARD_ORDER,
  PLAN_LIST_PRICES,
  PLAN_PRICES,
  UNLIMITED,
  isQuotaFeature,
  type PlanCardFeature,
  type PlanCardType,
} from '@/lib/plans/config';
import type { PlanFeatureKey, PlanType } from '@/types/plan';

type Icon = React.ComponentType<{ className?: string }>;

const FEATURE_ICONS: Record<PlanCardFeature, Icon> = {
  beneficiaries:              Users,
  redeemable_products:        Gift,
  push_notifications_monthly: Bell,
  cashiers:                   Wallet,
  branches:                   Store,
  collaborators:              UsersRound,
  beneficiary_map:            MapPinned,
  private_club:               Lock,
  campaigns:                  Megaphone,
};

/** Estilo por plan — la única parte que no sale de la base. */
const PLAN_STYLES: Record<PlanCardType, {
  icon: Icon;
  card: string;
  iconBox: string;
  price: string;
  badge: string;
  cta: string;
  ring: string;
}> = {
  trial: {
    icon: Star,
    card: 'bg-brand-blue/5 border-brand-blue/20',
    iconBox: 'bg-brand-blue/15 text-brand-blue',
    price: 'text-foreground',
    badge: 'bg-brand-blue text-white',
    cta: 'border-2 border-brand-blue bg-background text-brand-blue hover:bg-brand-blue/10',
    ring: 'ring-brand-blue',
  },
  advance: {
    icon: Zap,
    card: 'bg-brand-orange/5 border-brand-orange/20',
    iconBox: 'bg-brand-orange/15 text-brand-orange',
    price: 'text-brand-orange',
    badge: 'bg-brand-orange text-white',
    cta: 'bg-brand-orange text-white hover:bg-brand-orange/90',
    ring: 'ring-brand-orange',
  },
  pro: {
    icon: Crown,
    card: 'bg-brand-green/5 border-brand-green/20',
    iconBox: 'bg-brand-green/15 text-brand-green',
    price: 'text-brand-green',
    badge: 'bg-brand-green text-white',
    cta: 'bg-brand-green text-white hover:bg-brand-green/90',
    ring: 'ring-brand-green',
  },
};

// Cabecera y filas con alto fijo: la columna de etiquetas se alinea con las tarjetas.
const HEADER_H = 'lg:h-40';
const ROW = 'flex h-11 items-center border-b border-border/60 px-3 last:border-0';

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
      <Check className="size-5 text-brand-green" strokeWidth={3} />
    ) : (
      <span className="text-muted-foreground">-</span>
    );
  }
  // El español no agrupa 4 cifras por defecto; el diseño pide "1.000".
  return (
    <span className="font-semibold">
      {value === UNLIMITED ? unlimitedLabel : (value ?? 0).toLocaleString(locale, { useGrouping: 'always' })}
    </span>
  );
}

function FeatureLabel({ feature }: { feature: PlanCardFeature }) {
  const t = useTranslations('Onboarding.step3');
  const Icon = FEATURE_ICONS[feature];
  return (
    <span className="flex items-center gap-3 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0 text-foreground" />
      {t(`features.${feature}`)}
    </span>
  );
}

const formatArs = (n: number, locale: string) => `$${n.toLocaleString(locale, { useGrouping: 'always' })}`;

interface PlanCardProps {
  plan: PlanCardType;
  limits: Record<PlanFeatureKey, number> | undefined;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, limits, isSelected, isCurrent, onSelect }: PlanCardProps) {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const locale = useLocale();
  const style = PLAN_STYLES[plan];
  const Icon = style.icon;
  const price = PLAN_PRICES[plan] as number;
  const listPrice = PLAN_LIST_PRICES[plan];

  const ctaLabel = isCurrent
    ? tSettings('currentPlan')
    : isSelected
      ? t('selectedPlan')
      : t(`cta.${plan}`);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-3 transition-shadow',
        style.card,
        isSelected && cn('ring-2 ring-offset-2 ring-offset-background', style.ring)
      )}
    >
      {/* Clubi saluda asomado sobre Pro, como en el diseño. Sólo con la grilla en fila. */}
      {plan === 'pro' && (
        <div className="pointer-events-none absolute -top-[92px] left-4 hidden h-[92px] w-[140px] overflow-hidden lg:block">
          <Clubi className="w-full" />
        </div>
      )}
      {isCurrent && (
        <span
          className={cn(
            'absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
            style.badge
          )}
        >
          {tSettings('currentPlan')}
        </span>
      )}

      <div className={cn('flex flex-col gap-2 p-2', HEADER_H)}>
        <div className="flex items-start gap-3">
          <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', style.iconBox)}>
            <Icon className="size-6" />
          </div>
          <p className="whitespace-nowrap pt-3 text-base font-bold leading-tight text-foreground">
            {t(`${plan}Plan`)}
          </p>
          {/* Cuelga del borde superior para no robarle ancho al nombre del plan. */}
          {listPrice && (
            <div className={cn('absolute -top-4 right-3 rounded-lg px-2 py-1 text-center leading-none shadow-sm', style.badge)}>
              <p className="text-sm font-extrabold">{t('discountBadge')}</p>
              <p className="mt-0.5 text-[9px] font-medium">{t('discountNote')}</p>
            </div>
          )}
        </div>
        <div className="text-center">
          {listPrice && (
            <p className="text-sm font-semibold text-muted-foreground line-through">{formatArs(listPrice, locale)}</p>
          )}
          <p className={cn('text-3xl font-extrabold leading-tight', style.price)}>
            {price === 0 ? t('freePriceLabel') : formatArs(price, locale)}
          </p>
          <p className="text-xs text-muted-foreground">
            {price === 0 ? t('trialPriceNote') : t('paidPriceNote')}
          </p>
        </div>
      </div>

      <ul className="flex-1 rounded-xl bg-background/70">
        {PLAN_CARD_FEATURES.map((feature) => (
          <li key={feature} className={cn(ROW, 'justify-between gap-2 lg:justify-center')}>
            <span className="lg:sr-only">
              <FeatureLabel feature={feature} />
            </span>
            <FeatureValue feature={feature} value={limits?.[feature]} unlimitedLabel={t('unlimited')} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        aria-pressed={isSelected}
        onClick={onSelect}
        className={cn(
          'mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          style.cta,
          style.ring
        )}
      >
        {isSelected && <Check className="size-4" />}
        {ctaLabel}
        {!isSelected && <ArrowRight className="size-4" />}
      </button>
    </div>
  );
}

interface PlanCardsProps {
  limits: PlanLimitsByPlan | null;
  selected: PlanType | null;
  currentPlan?: PlanType | null;
  onSelect: (plan: PlanType) => void;
}

/**
 * La grilla de planes del diseño curado (Trial, Advance, Pro). Los valores salen
 * de `plan_limits`; los precios, de PLAN_PRICES / PLAN_LIST_PRICES.
 */
export function PlanCards({ limits, selected, currentPlan = null, onSelect }: PlanCardsProps) {
  const t = useTranslations('Onboarding.step3');

  const heading = (
    <div>
      <h3 className="text-2xl font-extrabold leading-tight text-foreground xl:text-3xl">
        {t('plansTitle')} <span className="text-brand-pink">{t('plansTitleHighlight')}</span>
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{t('plansSubtitle')}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="lg:hidden">{heading}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.15fr_repeat(3,1fr)] lg:gap-3 lg:pt-20">
        <div className="hidden lg:flex lg:flex-col lg:py-3">
          <div className={cn('flex flex-col justify-end pb-3', HEADER_H)}>{heading}</div>
          <ul className="rounded-xl border border-border/60 bg-background/70">
            {PLAN_CARD_FEATURES.map((feature) => (
              <li key={feature} className={ROW}>
                <FeatureLabel feature={feature} />
              </li>
            ))}
          </ul>
        </div>

        {PLAN_CARD_ORDER.map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            limits={limits?.[plan]}
            isSelected={selected === plan}
            isCurrent={currentPlan === plan}
            onSelect={() => onSelect(plan)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">{t('notificationsNote')}</p>
    </div>
  );
}
