'use client';

import { useState } from 'react';
import { Check, Star, Zap, Rocket, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { PlanUsageSummary } from '@/components/dashboard/plan/plan-usage-summary';


interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  icon: React.ElementType;
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
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

const iconColorMap: Record<string, string> = {
  emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40',
  blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40',
  purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40',
};

const badgeColorMap: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
};

const buttonColorMap: Record<string, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

const currentPlanBadgeMap: Record<string, string> = {
  emerald: 'bg-emerald-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
};

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-emerald-600" />
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PlanSelector() {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const { summary: usageSummary, isLoading: fetching } = usePlanUsage();
  const currentPlan = usageSummary?.plan ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      color: 'emerald',
      isPaid: false,
      features: [
        { label: f.rewards, value: '2' },
        { label: f.beneficiaries, value: '100' },
        { label: f.notificationsPerMonth, value: '3' },
        { label: f.cashiers, value: '1' },
        { label: f.branches, value: '1' },
        { label: f.collaborators, value: '1' },
        { label: f.beneficiaryMap, value: false },
        { label: f.dashboard, value: t('dashboardBasic') },
        { label: f.excelPdfExport, value: false },
        { label: f.customAI, value: false },
      ],
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
      features: [
        { label: f.rewards, value: '10', highlight: true },
        { label: f.beneficiaries, value: '500', highlight: true },
        { label: f.notificationsPerMonth, value: '10', highlight: true },
        { label: f.cashiers, value: '10', highlight: true },
        { label: f.branches, value: '5', highlight: true },
        { label: f.collaborators, value: '3', highlight: true },
        { label: f.beneficiaryMap, value: true },
        { label: f.dashboard, value: 'Business Intelligence' },
        { label: f.excelPdfExport, value: false },
        { label: f.customAI, value: t('adaptedMessaging') },
      ],
    },
    {
      id: 'pro',
      name: t('proPlan'),
      price: '$89',
      priceNote: t('paidPriceNote'),
      icon: Rocket,
      color: 'purple',
      isPaid: true,
      features: [
        { label: f.rewards, value: '30', highlight: true },
        { label: f.beneficiaries, value: '5.000', highlight: true },
        { label: f.notificationsPerMonth, value: '50', highlight: true },
        { label: f.cashiers, value: '100', highlight: true },
        { label: f.branches, value: '15', highlight: true },
        { label: f.collaborators, value: '10', highlight: true },
        { label: f.beneficiaryMap, value: true },
        { label: f.dashboard, value: 'Business Intelligence' },
        { label: f.excelPdfExport, value: true },
        { label: f.customAI, value: true },
      ],
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
    if (!selected || !isChangingPlan) return;

    const targetPlan = plans.find((p) => p.id === selected);
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
    } else {
      toast.info(tSettings('contactToDowngrade'));
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PlanUsageSummary />

      <div>
        <h2 className="text-lg font-semibold mb-4">{tSettings('availablePlans')}</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selected === plan.id;
            const isCurrent = currentPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={cn(
                  'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isSelected
                    ? colorMap[plan.color]
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {isCurrent && (
                  <span
                    className={cn(
                      'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold',
                      currentPlanBadgeMap[plan.color]
                    )}
                  >
                    {tSettings('currentPlan')}
                  </span>
                )}
                {!isCurrent && plan.badge && (
                  <span
                    className={cn(
                      'absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold',
                      badgeColorMap[plan.color]
                    )}
                  >
                    {plan.badge}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn('rounded-lg p-2', iconColorMap[plan.color])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      {plan.priceNote && (
                        <span className="text-xs text-muted-foreground">
                          {plan.priceNote}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {feature.label}
                      </span>
                      <FeatureValue value={feature.value} />
                    </li>
                  ))}
                </ul>

                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    {isCurrent ? tSettings('currentPlan') : t('selectedPlan')}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {isChangingPlan && selectedPlan.isPaid && (
          <span className="block mt-1">{t('securePayment')}</span>
        )}
      </p>

      {isChangingPlan && (
        <div className="flex justify-center">
          {isUpgrade ? (
            <Button
              className={cn('min-w-[240px]', buttonColorMap[selectedPlan.color])}
              onClick={handleChangePlan}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('redirectingToMP')}
                </>
              ) : (
                <>
                  {tSettings('upgradeTo', { plan: selectedPlan.name })}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {tSettings('contactToDowngrade')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
