'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Star, Zap, Rocket, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { PlanUsageSummary } from '@/components/dashboard/plan/plan-usage-summary';
import { getAllPlanLimitsAction } from '@/actions/dashboard/usage/actions';
import { verifySubscriptionAction } from '@/actions/dashboard/subscription/verify-subscription';
import type { PlanFeatureKey, PlanType } from '@/types/plan';


interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  isPaid: boolean;
  features: {
    label: string;
    value: string | boolean;
    highlight?: boolean;
  }[];
}

const colorMap: Record<string, string> = {
  green: 'border-brand-green bg-brand-green/10',
  blue: 'border-brand-blue bg-brand-blue/10',
  pink: 'border-brand-pink bg-brand-pink/10',
};

const iconColorMap: Record<string, string> = {
  green: 'text-brand-green bg-brand-green/15',
  blue: 'text-brand-blue bg-brand-blue/15',
  pink: 'text-brand-pink bg-brand-pink/15',
};

const badgeColorMap: Record<string, string> = {
  green: 'bg-brand-green/15 text-brand-green',
  blue: 'bg-brand-blue/15 text-brand-blue',
  pink: 'bg-brand-pink/15 text-brand-pink',
};

const buttonColorMap: Record<string, string> = {
  green: 'bg-brand-green hover:bg-brand-green/90 text-white',
  blue: 'bg-brand-blue hover:bg-brand-blue/90 text-white',
  pink: 'bg-brand-pink hover:bg-brand-pink/90 text-white',
};

const currentPlanBadgeMap: Record<string, string> = {
  green: 'bg-brand-green text-white',
  blue: 'bg-brand-blue text-white',
  pink: 'bg-brand-pink text-white',
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-3.5 w-3.5 text-brand-green" />
    ) : (
      <span className="text-muted-foreground text-[10px]">—</span>
    );
  }
  return <span className="text-[11px] font-medium">{value}</span>;
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-AR');
}

function buildFeatures(
  f: Record<string, string>,
  t: ReturnType<typeof useTranslations>,
  planId: PlanType,
  limits: Record<PlanFeatureKey, number> | undefined,
  isPaid: boolean
): Plan['features'] {
  const v = (key: PlanFeatureKey) => formatNumber(limits?.[key] ?? 0);
  const highlight = isPaid;

  const numericFeatures: { label: string; key: PlanFeatureKey }[] = [
    { label: f.rewards, key: 'redeemable_products' },
    { label: f.beneficiaries, key: 'beneficiaries' },
    { label: f.notificationsPerMonth, key: 'push_notifications_monthly' },
    { label: f.cashiers, key: 'cashiers' },
    { label: f.branches, key: 'branches' },
    { label: f.collaborators, key: 'collaborators' },
  ];

  const features: Plan['features'] = numericFeatures.map(({ label, key }) => ({
    label,
    value: v(key),
    ...(highlight ? { highlight: true } : {}),
  }));

  if (planId === 'trial') {
    features.push(
      { label: f.beneficiaryMap, value: false },
      { label: f.dashboard, value: t('dashboardBasic') },
      { label: f.excelPdfExport, value: false },
      { label: f.customAI, value: false }
    );
  } else if (planId === 'advance') {
    features.push(
      { label: f.beneficiaryMap, value: true },
      { label: f.dashboard, value: f.businessIntelligence },
      { label: f.excelPdfExport, value: false },
      { label: f.customAI, value: t('adaptedMessaging') }
    );
  } else {
    features.push(
      { label: f.beneficiaryMap, value: true },
      { label: f.dashboard, value: f.businessIntelligence },
      { label: f.excelPdfExport, value: true },
      { label: f.customAI, value: true }
    );
  }

  return features;
}

export function PlanSelectorInner() {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const { summary: usageSummary, isLoading: fetching, invalidate } = usePlanUsage();
  const currentPlan = usageSummary?.plan ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [planLimits, setPlanLimits] = useState<Record<PlanType, Record<PlanFeatureKey, number>> | null>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    getAllPlanLimitsAction().then((data) => {
      if (data) setPlanLimits(data);
    });
  }, []);

  // Verify subscription status when returning from MercadoPago
  useEffect(() => {
    const preapprovalId = new URL(window.location.href).searchParams.get('preapproval_id');
    if (!preapprovalId || verifiedRef.current) return;
    verifiedRef.current = true;
    setVerifying(true);

    const verify = async () => {
      try {
        const data = await verifySubscriptionAction(preapprovalId);

        if (data.status === 'authorized') {
          toast.success(tSettings('planUpgraded'));
          invalidate();
        } else if (data.status === 'pending') {
          toast.info(tSettings('paymentPending'));
        }
      } catch {
        // Silent — webhook will handle it eventually
      } finally {
        setVerifying(false);
        // Clean the URL without a client-side redirect
        window.history.replaceState(null, '', '/dashboard/settings/plan');
      }
    };

    verify();
  }, [invalidate, tSettings]);

  // Sync selected with current plan when data loads
  if (selected === null && currentPlan !== null) {
    setSelected(currentPlan);
  }

  const f = t.raw('features') as Record<string, string>;

  const plans: Plan[] = [
    {
      id: 'trial',
      name: t('trialPlan'),
      price: t('freePriceLabel'),
      priceNote: t('trialPriceNote'),
      icon: Star,
      color: 'green',
      isPaid: false,
      features: buildFeatures(f, t, 'trial', planLimits?.trial, false),
    },
    {
      id: 'advance',
      name: t('advancePlan'),
      price: '$50',
      priceNote: t('paidPriceNote'),
      icon: Zap,
      color: 'blue',
      badge: t('popularBadge'),
      isPaid: true,
      features: buildFeatures(f, t, 'advance', planLimits?.advance, true),
    },
    {
      id: 'pro',
      name: t('proPlan'),
      price: '$89',
      priceNote: t('paidPriceNote'),
      icon: Rocket,
      color: 'pink',
      isPaid: true,
      features: buildFeatures(f, t, 'pro', planLimits?.pro, true),
    },
  ];

  const selectedPlan = plans.find((p) => p.id === selected) ?? plans[0];
  const isChangingPlan = selected !== currentPlan;
  const isUpgrade =
    selected !== currentPlan &&
    selectedPlan.isPaid &&
    (currentPlan === 'trial' ||
      (currentPlan === 'advance' && selected === 'pro'));

  const handleChangePlan = async () => {
    /* c8 ignore next */
    if (!selected || !isChangingPlan) return;

    const targetPlan = plans.find((p) => p.id === selected);
    /* c8 ignore next */
    if (!targetPlan) return;

    if (targetPlan.isPaid) {
      setLoading(true);
      try {
        const res = await fetch('/api/mercadopago/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: selected,
            backUrl: '/dashboard/settings/plan',
          }),
        });

        const data = (await res.json()) as {
          initPoint?: string;
          preapprovalId?: string;
          error?: string;
        };

        if (!res.ok || !data.initPoint) {
          throw new Error(data.error ?? t('paymentInitError'));
        }

        window.location.href = data.initPoint;
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t('paymentError')
        );
        setLoading(false);
      }
    } else /* c8 ignore start */ {
      toast.info(tSettings('contactToDowngrade'));
    } /* c8 ignore stop */
  };

  if (fetching || !planLimits || verifying) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PlanUsageSummary hideUpgradeLink />

      <div>
        <h2 className="text-sm font-semibold mb-2">{tSettings('availablePlans')}</h2>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selected === plan.id;
            const isCurrent = currentPlan === plan.id;
            const showUpgradeButton = isSelected && isChangingPlan && isUpgrade;
            const showDowngradeMsg = isSelected && isChangingPlan && !isUpgrade;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={cn(
                  'relative flex flex-col rounded-lg border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
                  isSelected
                    ? colorMap[plan.color]
                    : 'border-border hover:border-muted-foreground/30'
                )}
              >
                {isCurrent && (
                  <span
                    className={cn(
                      'absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                      currentPlanBadgeMap[plan.color]
                    )}
                  >
                    {tSettings('currentPlan')}
                  </span>
                )}
                {!isCurrent && plan.badge && (
                  <span
                    className={cn(
                      'absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                      badgeColorMap[plan.color]
                    )}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('rounded-md p-1.5', iconColorMap[plan.color])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-foreground">
                        {plan.price}
                      </span>
                      {plan.priceNote && (
                        <span className="text-[10px] text-muted-foreground">
                          {plan.priceNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ul className="space-y-1 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center justify-between gap-1"
                    >
                      <span className="text-[11px] text-muted-foreground">
                        {feature.label}
                      </span>
                      <FeatureValue value={feature.value} />
                    </li>
                  ))}
                </ul>

                {isSelected && !showUpgradeButton && !showDowngradeMsg && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand-green">
                    <Check className="h-3.5 w-3.5" />
                    {/* c8 ignore next */ isCurrent ? tSettings('currentPlan') : t('selectedPlan')}
                  </div>
                )}

                {showUpgradeButton && (
                  <div className="mt-2" role="presentation" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      className={cn('w-full text-xs h-8', buttonColorMap[selectedPlan.color])}
                      onClick={handleChangePlan}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          {t('redirectingToMP')}
                        </>
                      ) : (
                        <>
                          {tSettings('upgradeTo', { plan: selectedPlan.name })}
                          <ArrowRight className="ml-1.5 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {showDowngradeMsg && (
                  <p className="mt-2 text-[11px] text-muted-foreground text-center">
                    {tSettings('contactToDowngrade')}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {isChangingPlan && selectedPlan.isPaid && (
          <span className="block">{t('securePayment')}</span>
        )}
      </p>
    </div>
  );
}
