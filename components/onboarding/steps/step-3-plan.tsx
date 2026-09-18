'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { PlanCards, type PlanLimitsByPlan } from '@/components/plan/plan-cards';
import {
  PLAN_ORDER,
  isContactSalesPlan,
  isPaidPlan,
  planButtonColorMap,
  planColor,
} from '@/lib/plans/config';
import { getAllPlanLimitsAction } from '@/actions/dashboard/usage/actions';
import type { PlanType } from '@/types/plan';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Step3Props {
  onNext: (plan: string) => void;
  onBack: () => void;
  initialPlan?: string;
  userEmail?: string;
}

export function Step3Plan({ onNext, onBack, initialPlan = 'trial', userEmail = '' }: Step3Props) {
  const t = useTranslations('Onboarding.step3');
  const tCommon = useTranslations('Common');
  // initialPlan viene de localStorage: puede traer un id de una versión vieja.
  const [selected, setSelected] = useState<PlanType>(
    () => PLAN_ORDER.find((plan) => plan === initialPlan) ?? PLAN_ORDER[0]
  );
  const [loading, setLoading] = useState(false);
  const [payerEmail, setPayerEmail] = useState<string>(() => userEmail);
  const [planLimits, setPlanLimits] = useState<PlanLimitsByPlan | null>(null);

  useEffect(() => {
    getAllPlanLimitsAction().then((data) => {
      if (data) setPlanLimits(data);
    });
  }, []);

  const isPaid = isPaidPlan(selected);
  // Enterprise no se autogestiona: la cuenta arranca en Trial y sigue comercial.
  const isContactSales = isContactSalesPlan(selected);

  const handleContinue = async () => {
    if (isContactSales) {
      onNext('trial');
      return;
    }
    if (!isPaid) {
      onNext(selected);
      return;
    }

    const trimmedPayerEmail = payerEmail.trim();
    if (!EMAIL_REGEX.test(trimmedPayerEmail)) {
      toast.error(t('payerEmailInvalid'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected, payerEmail: trimmedPayerEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        toast.error(data.error ?? t('paymentInitError'));
        return;
      }

      const data = await res.json() as { initPoint?: string; preapprovalId?: string; error?: string };

      if (!data.initPoint) {
        toast.error(data.error ?? t('paymentInitError'));
        return;
      }

      if (data.preapprovalId) {
        localStorage.setItem('mp_preapproval_id', data.preapprovalId);
      }
      localStorage.setItem('onboarding_plan', selected);

      window.location.href = data.initPoint;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PlanCards limits={planLimits} selected={selected} onSelect={setSelected} />

      {isContactSales && (
        <p className="mx-auto max-w-md rounded-lg bg-brand-violet/10 p-3 text-center text-xs text-muted-foreground">
          {t('enterpriseOnboardingNote')}
        </p>
      )}

      {isPaid && (
        <div className="mx-auto max-w-md space-y-1.5">
          <Label htmlFor="payer-email">{t('payerEmailLabel')}</Label>
          <Input
            id="payer-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            placeholder={t('payerEmailPlaceholder')}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">{t('payerEmailHelp')}</p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {isPaid && <span className="block mt-1">{t('securePayment')}</span>}
      </p>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          {tCommon('back')}
        </Button>
        <Button
          type="button"
          className={cn('flex-1', planButtonColorMap[planColor(selected)])}
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('redirectingToMP')}
            </>
          ) : (
            t('continueWith', { plan: t(`${isContactSales ? 'trial' : selected}Plan`) })
          )}
        </Button>
      </div>
    </div>
  );
}
