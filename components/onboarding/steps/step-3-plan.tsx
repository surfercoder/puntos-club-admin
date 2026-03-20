'use client';

import { useState } from 'react';
import { Check, Star, Zap, Rocket, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-brand-green" />
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

interface Step3Props {
  onNext: (plan: string) => void;
  onBack: () => void;
  initialPlan?: string;
}

export function Step3Plan({ onNext, onBack, initialPlan = 'trial' }: Step3Props) {
  const t = useTranslations('Onboarding.step3');
  const tCommon = useTranslations('Common');
  const [selected, setSelected] = useState<string>(() => initialPlan);
  const [loading, setLoading] = useState(false);

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
        { label: f.dashboard, value: f.businessIntelligence },
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
      color: 'pink',
      isPaid: true,
      features: [
        { label: f.rewards, value: '30', highlight: true },
        { label: f.beneficiaries, value: '5.000', highlight: true },
        { label: f.notificationsPerMonth, value: '50', highlight: true },
        { label: f.cashiers, value: '100', highlight: true },
        { label: f.branches, value: '15', highlight: true },
        { label: f.collaborators, value: '10', highlight: true },
        { label: f.beneficiaryMap, value: true },
        { label: f.dashboard, value: f.businessIntelligence },
        { label: f.excelPdfExport, value: true },
        { label: f.customAI, value: true },
      ],
    },
  ];

  const selectedPlan = plans.find((p) => p.id === selected) ?? plans[0];

  const handleContinue = async () => {
    if (!selectedPlan.isPaid) {
      onNext(selected);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected }),
      });

      const data = await res.json() as { initPoint?: string; preapprovalId?: string; error?: string };

      if (!res.ok || !data.initPoint) {
        throw new Error(data.error ?? t('paymentInitError'));
      }

      if (data.preapprovalId) {
        localStorage.setItem('mp_preapproval_id', data.preapprovalId);
      }
      localStorage.setItem('onboarding_plan', selected);

      window.location.href = data.initPoint;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('paymentError'));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                isSelected
                  ? colorMap[plan.color]
                  : 'border-border hover:border-muted-foreground/30'
              )}
            >
              {plan.badge && (
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
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.priceNote && (
                      <span className="text-xs text-muted-foreground">{plan.priceNote}</span>
                    )}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                    <FeatureValue value={feature.value} />
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-green">
                  <Check className="h-4 w-4" />
                  {t('selectedPlan')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {selectedPlan.isPaid && (
          <span className="block mt-1">
            {t('securePayment')}
          </span>
        )}
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          {tCommon('back')}
        </Button>
        <Button
          type="button"
          className={cn('flex-1', buttonColorMap[selectedPlan.color])}
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('redirectingToMP')}
            </>
          ) : (
            t('continueWith', { plan: selectedPlan.name })
          )}
        </Button>
      </div>
    </div>
  );
}
