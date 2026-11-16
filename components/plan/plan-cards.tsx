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
  Palette,
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
  planChargeAmount,
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
  white_label:                Palette,
};

/** La fila que el mockup resalta: rosa en la etiqueta y, donde está incluida, verde con su nombre. */
const HIGHLIGHTED: PlanCardFeature = 'white_label';

/** Estilo por plan — la única parte que no sale de la base. Colores del mockup curado. */
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
    card: 'bg-[color-mix(in_srgb,var(--color-sitio-blue)_7%,var(--background))] border-sitio-blue/15',
    iconBox: 'bg-sitio-blue/12 text-sitio-blue',
    price: 'text-foreground',
    badge: 'bg-sitio-blue text-white',
    cta: 'border-[1.5px] border-sitio-blue bg-background text-sitio-blue hover:bg-sitio-blue/10',
    ring: 'ring-sitio-blue',
  },
  advance: {
    icon: Zap,
    card: 'bg-[color-mix(in_srgb,#ff5a1f_8%,var(--background))] border-[#ff5a1f]/15',
    iconBox: 'bg-[#ff8a1f]/20 text-[#ff8a1f]',
    price: 'text-[#ff4f17]',
    badge: 'bg-[#ff5a1f] text-white',
    cta: 'bg-[#ff5a1f] text-white hover:bg-[#ec4a10]',
    ring: 'ring-[#ff5a1f]',
  },
  pro: {
    icon: Crown,
    card: 'bg-[color-mix(in_srgb,#0a9d47_8%,var(--background))] border-[#0a9d47]/15',
    iconBox: 'bg-[#0a9d47]/15 text-[#0a9d47]',
    price: 'text-[#049d44]',
    badge: 'bg-[#0a9d47] text-white',
    cta: 'bg-[#0a9d47] text-white hover:bg-[#08883d]',
    ring: 'ring-[#0a9d47]',
  },
};

// Cabecera y filas con alto fijo: la columna de etiquetas se alinea con las tarjetas.
// Desde @[84rem] (la página /planes) van las medidas del mockup en px; más angosto
// (onboarding, Ajustes) la misma grilla en chico.
const HEADER_H = '@4xl:h-40 @[84rem]:h-[189px]';
const ROW_H = 'h-11 @[84rem]:h-[50px]';
const ROW = cn('flex items-center border-b border-border/60 px-3 last:border-0', ROW_H);

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
  const t = useTranslations('Onboarding.step3');

  if (feature === HIGHLIGHTED && value && value > 0) {
    return (
      <span className="flex items-center gap-2 rounded-xl bg-[#0a9d47]/12 px-3 py-1 text-xs leading-tight text-foreground/80 @[84rem]:gap-4 @[84rem]:px-6 @[84rem]:text-[17px]">
        <Check className="size-5 shrink-0 text-[#0a9d47] @[84rem]:size-7" strokeWidth={3} />
        <span className="hidden @4xl:inline">{t(`features.${HIGHLIGHTED}`)}</span>
      </span>
    );
  }
  if (!isQuotaFeature(feature)) {
    return value && value > 0 ? (
      <Check className="size-5 text-[#0a9d47] @[84rem]:size-7" strokeWidth={3} />
    ) : (
      <span className="text-muted-foreground">-</span>
    );
  }
  // El español no agrupa 4 cifras por defecto; el diseño pide "1.000".
  return (
    <span className="font-semibold @[84rem]:text-lg">
      {value === UNLIMITED ? unlimitedLabel : (value ?? 0).toLocaleString(locale, { useGrouping: 'always' })}
    </span>
  );
}

function FeatureLabel({ feature }: { feature: PlanCardFeature }) {
  const t = useTranslations('Onboarding.step3');
  const Icon = FEATURE_ICONS[feature];
  return (
    <span className="flex items-center gap-3 text-sm text-foreground/80 @[84rem]:gap-[34px] @[84rem]:text-[17px]">
      <Icon className="size-4 shrink-0 text-foreground @[84rem]:-ml-[42px] @[84rem]:size-[26px]" />
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
  promo: boolean;
  onSelect: () => void;
}

function PlanCard({ plan, limits, isSelected, isCurrent, promo, onSelect }: PlanCardProps) {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const locale = useLocale();
  const style = PLAN_STYLES[plan];
  const Icon = style.icon;
  // Sin promo (la de la org ya venció) se muestra el precio de lista, sin cartel.
  const listPrice = promo ? PLAN_LIST_PRICES[plan] : undefined;
  const price = promo ? (PLAN_PRICES[plan] as number) : planChargeAmount(plan, false);

  const ctaLabel = isCurrent
    ? tSettings('currentPlan')
    : isSelected
      ? t('selectedPlan')
      : t(`cta.${plan}`);

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-3 transition-shadow @[84rem]:rounded-[22px] @[84rem]:p-3.5',
        style.card,
        isSelected && cn('ring-2 ring-offset-2 ring-offset-background', style.ring)
      )}
    >
      {/* Clubi saluda asomado sobre Pro, como en el diseño. Sólo con la grilla en fila (según el ancho del contenedor, no de la pantalla). */}
      {plan === 'pro' && (
        <div className="pointer-events-none absolute -top-[92px] left-4 hidden h-[92px] w-[140px] overflow-hidden @4xl:block">
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

      {/* Cartel "50% OFF": en chico cuelga del borde para no robarle ancho al nombre; en grande va adentro, como globo. */}
      {listPrice && (
        <div
          className={cn(
            'absolute -top-4 right-3 rounded-lg px-2 py-1 text-center leading-none shadow-sm',
            '@[84rem]:top-7 @[84rem]:right-2.5 @[84rem]:w-[81px] @[84rem]:rounded-[10px] @[84rem]:px-1 @[84rem]:py-2.5',
            style.badge
          )}
        >
          <p className="text-sm font-extrabold @[84rem]:text-[26px] @[84rem]:leading-[1.1]">
            {/* En grande el ancho fijo de 81px parte "50% OFF" en dos renglones solo. */}
            {t('discountBadge')}
          </p>
          <p className="mt-0.5 text-[9px] font-medium @[84rem]:mt-1.5 @[84rem]:text-[11px]">{t('discountNote')}</p>
          <span className={cn('absolute -bottom-1.5 right-3 hidden size-3 rotate-45 @[84rem]:block', style.badge)} />
        </div>
      )}

      <div className={cn('flex flex-col p-2 @[84rem]:px-3 @[84rem]:pt-3.5', HEADER_H)}>
        <div className="flex items-start gap-3 @[84rem]:gap-4">
          <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-full @[84rem]:size-[84px]', style.iconBox)}>
            <Icon className="size-6 @[84rem]:size-10" />
          </div>
          <div className={cn('flex flex-col pt-3 @[84rem]:pt-2.5', price === 0 && 'items-center')}>
            <p className="whitespace-nowrap text-base font-bold leading-tight text-foreground @[84rem]:text-[21px]">
              {t(`${plan}Plan`)}
            </p>
            {listPrice && (
              <p className="text-sm font-semibold text-muted-foreground line-through @[84rem]:mt-2.5 @[84rem]:text-[21px]">
                {formatArs(listPrice, locale)}
              </p>
            )}
            {price === 0 && (
              <>
                <p className={cn('text-3xl font-extrabold leading-tight @[84rem]:text-[44px] @[84rem]:leading-[1.2]', style.price)}>
                  {t('freePriceLabel')}
                </p>
                <p className="text-xs text-muted-foreground @[84rem]:text-lg @[84rem]:leading-tight @[84rem]:text-foreground/80">
                  {t('trialPriceNote')}
                </p>
              </>
            )}
          </div>
        </div>
        {price > 0 && (
          <div className="mt-1 text-center @[84rem]:-mt-1">
            <p className={cn('text-3xl font-extrabold leading-tight tracking-tight @[84rem]:text-[48px] @[84rem]:leading-[1.1]', style.price)}>
              {formatArs(price, locale)}
            </p>
            <p className="text-xs text-muted-foreground @[84rem]:text-lg @[84rem]:leading-tight @[84rem]:text-foreground/80">
              {t('paidPriceNote')}
            </p>
          </div>
        )}
      </div>

      <ul className="flex-1 rounded-xl bg-background/70 @[84rem]:rounded-2xl">
        {PLAN_CARD_FEATURES.map((feature) => (
          <li key={feature} className={cn(ROW, 'justify-between gap-2 @4xl:justify-center')}>
            <span className="@4xl:sr-only">
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
          'mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 @[84rem]:h-[60px] @[84rem]:rounded-2xl @[84rem]:text-[19px]',
          style.cta,
          style.ring
        )}
      >
        {isSelected && <Check className="size-4" />}
        {ctaLabel}
        {!isSelected && <ArrowRight className="size-4 @[84rem]:ml-1 @[84rem]:size-5" />}
      </button>
    </div>
  );
}

interface PlanCardsProps {
  limits: PlanLimitsByPlan | null;
  selected: PlanType | null;
  currentPlan?: PlanType | null;
  /** false cuando la promo de la org ya venció (Ajustes): muestra el precio de lista. */
  promo?: boolean;
  onSelect: (plan: PlanType) => void;
}

/**
 * La grilla de planes del diseño curado (Trial, Advance, Pro). Los valores salen
 * de `plan_limits`; los precios, de PLAN_PRICES / PLAN_LIST_PRICES.
 */
export function PlanCards({ limits, selected, currentPlan = null, promo = true, onSelect }: PlanCardsProps) {
  const t = useTranslations('Onboarding.step3');

  const heading = (
    <div className="@[84rem]:-mt-4">
      <h3 className="text-2xl font-extrabold leading-tight text-foreground @5xl:text-3xl @[84rem]:text-[38px] @[84rem]:leading-[1.12]">
        {t('plansTitle')} <span className="text-brand-pink">{t('plansTitleHighlight')}</span>
      </h3>
      <p className="mt-2 text-sm text-muted-foreground @[84rem]:mt-4 @[84rem]:max-w-[358px] @[84rem]:text-lg @[84rem]:leading-[25px] @[84rem]:text-foreground/85">
        {t('plansSubtitle')}
      </p>
    </div>
  );

  return (
    <div className="@container space-y-4">
      <div className="@4xl:hidden">{heading}</div>

      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-[1.15fr_repeat(3,1fr)] @4xl:gap-3 @4xl:pt-20 @[84rem]:grid-cols-[373fr_322fr_370fr_368fr] @[84rem]:gap-2.5">
        <div className="hidden @4xl:flex @4xl:flex-col @4xl:py-3">
          <div className={cn('flex flex-col justify-end pb-3 @[84rem]:justify-start', HEADER_H)}>{heading}</div>
          <ul className="rounded-xl border border-border/60 bg-background/70 @[84rem]:rounded-2xl @[84rem]:border-0 @[84rem]:bg-background/85 @[84rem]:shadow-[0_8px_24px_-16px_rgba(80,40,90,0.25)]">
            {PLAN_CARD_FEATURES.map((feature) => (
              <li
                key={feature}
                className={cn(ROW, '@[84rem]:border-0 @[84rem]:px-0', feature === HIGHLIGHTED && 'rounded-xl bg-brand-pink/8')}
              >
                {/* En grande el ícono va en su propia celda y la línea arranca después, como en el mockup. */}
                <span
                  className={cn(
                    'flex h-full flex-1 items-center @[84rem]:ml-[62px] @[84rem]:border-b @[84rem]:border-border/60 @[84rem]:[li:last-child>&]:border-0',
                    // El mockup corta en "colores / del entorno".
                    feature === HIGHLIGHTED && '@[84rem]:pr-16'
                  )}
                >
                  <FeatureLabel feature={feature} />
                </span>
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
            promo={promo}
            onSelect={() => onSelect(plan)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">{t('notificationsNote')}</p>
    </div>
  );
}
