'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { Check, Star, Zap, Rocket, Loader2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';
import { PlanUsageSummary } from '@/components/dashboard/plan/plan-usage-summary';
import { getAllPlanLimitsAction } from '@/actions/dashboard/usage/actions';
import { verifySubscriptionAction } from '@/actions/dashboard/subscription/verify-subscription';
import { cancelSubscriptionAction } from '@/actions/dashboard/subscription/cancel-subscription';
import type { PlanFeatureKey, PlanType } from '@/types/plan';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      <Check className="size-3.5 text-brand-green" />
    ) : (
      <span className="text-muted-foreground text-[10px]">-</span>
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

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  currentPlanLabel: string;
  selectedPlanLabel: string;
}

function PlanCard({
  plan,
  isSelected,
  isCurrent,
  onSelect,
  currentPlanLabel,
  selectedPlanLabel,
}: PlanCardProps) {
  const Icon = plan.icon;
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-lg border-2 p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer',
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
          {currentPlanLabel}
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
          <Icon className="size-4" />
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

      {isSelected && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-brand-green">
          <Check className="size-3.5" />
          {isCurrent ? currentPlanLabel : selectedPlanLabel}
        </div>
      )}
    </button>
  );
}

type ChangePlanState = {
  selected: string | null;
  loading: boolean;
  confirmAction: 'cancel' | 'switch' | null;
};

type ChangePlanAction =
  | { type: 'SET_SELECTED'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'OPEN_CONFIRM'; payload: 'cancel' | 'switch' }
  | { type: 'CLOSE_CONFIRM' };

const initialChangePlanState: ChangePlanState = {
  selected: null,
  loading: false,
  confirmAction: null,
};

function changePlanReducer(
  state: ChangePlanState,
  action: ChangePlanAction
): ChangePlanState {
  switch (action.type) {
    case 'SET_SELECTED':
      return { ...state, selected: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'OPEN_CONFIRM':
      return { ...state, confirmAction: action.payload };
    case 'CLOSE_CONFIRM':
      return { ...state, confirmAction: null };
    /* c8 ignore next 2 */
    default:
      return state;
  }
}

interface PlanChangeActionsProps {
  isUpgrade: boolean;
  isCancelToTrial: boolean;
  isSwitchPaidToPaid: boolean;
  loading: boolean;
  selectedPlan: Plan;
  onChangePlan: () => void;
  upgradeLabel: string;
  cancelLabel: string;
  switchLabel: string;
  redirectingLabel: string;
}

function PlanChangeActions({
  isUpgrade,
  isCancelToTrial,
  isSwitchPaidToPaid,
  loading,
  selectedPlan,
  onChangePlan,
  upgradeLabel,
  cancelLabel,
  switchLabel,
  redirectingLabel,
}: PlanChangeActionsProps) {
  if (isUpgrade) {
    return (
      <div className="mt-3">
        <Button
          className={cn('w-full text-xs', buttonColorMap[selectedPlan.color])}
          onClick={onChangePlan}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 size-3 animate-spin" />
              {redirectingLabel}
            </>
          ) : (
            <>
              {upgradeLabel}
              <ArrowRight className="ml-1.5 size-3" />
            </>
          )}
        </Button>
      </div>
    );
  }
  if (isCancelToTrial) {
    return (
      <div className="mt-3">
        <Button
          variant="destructive"
          className="w-full text-xs"
          onClick={onChangePlan}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      </div>
    );
  }
  // Parent guards on `isChangingPlan`, and every plan-change transition matches
  // one of the three flags above, so this fallthrough is unreachable. It exists
  // only to satisfy the type checker.
  /* c8 ignore start */
  if (!isSwitchPaidToPaid) return null;
  /* c8 ignore stop */
  return (
    <div className="mt-3">
      <Button
        className={cn('w-full text-xs', buttonColorMap[selectedPlan.color])}
        onClick={onChangePlan}
        disabled={loading}
      >
        {switchLabel}
        <ArrowRight className="ml-1.5 size-3" />
      </Button>
    </div>
  );
}

interface PlanChangeConfirmDialogProps {
  confirmAction: 'cancel' | 'switch' | null;
  loading: boolean;
  selectedPlanName: string;
  onClose: () => void;
  onConfirmCancel: () => void;
  onConfirmSwitch: () => void;
  tSettings: ReturnType<typeof useTranslations>;
}

function PlanChangeConfirmDialog({
  confirmAction,
  loading,
  selectedPlanName,
  onClose,
  onConfirmCancel,
  onConfirmSwitch,
  tSettings,
}: PlanChangeConfirmDialogProps) {
  const isSwitch = confirmAction === 'switch';
  return (
    <Dialog
      open={confirmAction !== null}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSwitch
              ? tSettings('switchConfirmTitle', { plan: selectedPlanName })
              : tSettings('cancelConfirmTitle')}
          </DialogTitle>
          <DialogDescription>
            {isSwitch
              ? tSettings('switchConfirmDescription', { plan: selectedPlanName })
              : tSettings('cancelConfirmDescription')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {tSettings('keepSubscription')}
          </Button>
          <Button
            variant={isSwitch ? 'default' : 'destructive'}
            onClick={isSwitch ? onConfirmSwitch : onConfirmCancel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-3 animate-spin" />
                {isSwitch ? tSettings('switchingPlan') : tSettings('cancelling')}
              </>
            ) : (
              isSwitch ? tSettings('confirmSwitch') : tSettings('confirmCancel')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlanSelectorInner() {
  const t = useTranslations('Onboarding.step3');
  const tSettings = useTranslations('Dashboard.planSettings');
  const { summary: usageSummary, isLoading: fetching, invalidate } = usePlanUsage();
  const currentPlan = usageSummary?.plan ?? null;
  const [state, dispatch] = useReducer(changePlanReducer, initialChangePlanState);
  const { selected, loading, confirmAction } = state;
  // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [verifying, setVerifying] = useState(false);
  // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [planLimits, setPlanLimits] = useState<Record<PlanType, Record<PlanFeatureKey, number>> | null>(null);
  // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [payerEmail, setPayerEmail] = useState('');
  const verifiedRef = useRef(false);

  useEffect(() => {
    getAllPlanLimitsAction().then((data) => {
      if (data) setPlanLimits(data);
    });
  }, []);

  // Default the payer email to the logged-in user's email (it can be changed:
  // owners often pay with a different Mercado Pago account, e.g. treasury).
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user?.email) setPayerEmail(data.user.email);
      });
  }, []);

  // Verify subscription status when returning from MercadoPago
  useEffect(() => {
    const preapprovalId = new URLSearchParams(window.location.search).get('preapproval_id');
    if (!preapprovalId || verifiedRef.current) return;
    verifiedRef.current = true;
    setVerifying(true);
    let cancelled = false;

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
      }
      if (!cancelled) {
        setVerifying(false);
        // Clean the URL without a client-side redirect
        window.history.replaceState(null, '', '/dashboard/settings/plan');
      }
    };

    verify();
    return () => { cancelled = true; };
  }, [invalidate, tSettings]);

  // Sync selected with current plan when data loads
  if (selected === null && currentPlan !== null) {
    dispatch({ type: 'SET_SELECTED', payload: currentPlan });
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
  const isCancelToTrial =
    isChangingPlan && selected === 'trial' && (currentPlan === 'advance' || currentPlan === 'pro');
  const isSwitchPaidToPaid =
    isChangingPlan && currentPlan === 'pro' && selected === 'advance';

  const startCheckoutForSelected = async () => {
    const trimmedPayerEmail = payerEmail.trim();
    if (!EMAIL_REGEX.test(trimmedPayerEmail)) {
      throw new Error(t('payerEmailInvalid'));
    }

    const res = await fetch('/api/mercadopago/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: selected,
        backUrl: '/dashboard/settings/plan',
        payerEmail: trimmedPayerEmail,
      }),
    });

    if (!res.ok) {
      const errorData = (await res.json()) as { error?: string };
      throw new Error(errorData.error ?? t('paymentInitError'));
    }

    const data = (await res.json()) as {
      initPoint?: string;
      preapprovalId?: string;
      error?: string;
    };

    if (!data.initPoint) {
      throw new Error(data.error ?? t('paymentInitError'));
    }

    window.location.href = data.initPoint;
  };

  const handleChangePlan = async () => {
    /* c8 ignore next */
    if (!selected || !isChangingPlan) return;

    if (isUpgrade) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await startCheckoutForSelected();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('paymentError'));
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return;
    }

    if (isSwitchPaidToPaid) {
      dispatch({ type: 'OPEN_CONFIRM', payload: 'switch' });
      return;
    }

    if (isCancelToTrial) {
      dispatch({ type: 'OPEN_CONFIRM', payload: 'cancel' });
    }
  };

  const handleConfirmCancel = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await cancelSubscriptionAction();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(tSettings('cancelSuccess'));
        dispatch({ type: 'CLOSE_CONFIRM' });
        invalidate();
      }
    } catch {
      toast.error(tSettings('cancelError'));
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const handleConfirmSwitch = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await cancelSubscriptionAction();
      if (result.error) {
        toast.error(result.error);
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      await startCheckoutForSelected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('paymentError'));
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  if (fetching || !planLimits || verifying) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PlanUsageSummary hideUpgradeLink />

      <div>
        <h2 className="text-sm font-semibold mb-2">{tSettings('availablePlans')}</h2>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selected === plan.id}
              isCurrent={currentPlan === plan.id}
              onSelect={() => dispatch({ type: 'SET_SELECTED', payload: plan.id })}
              currentPlanLabel={tSettings('currentPlan')}
              selectedPlanLabel={t('selectedPlan')}
            />
          ))}
        </div>

        {isChangingPlan && selectedPlan.isPaid && (isUpgrade || isSwitchPaidToPaid) && (
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="payer-email" className="text-xs">{t('payerEmailLabel')}</Label>
            <Input
              id="payer-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              placeholder={t('payerEmailPlaceholder')}
              disabled={loading}
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{t('payerEmailHelp')}</p>
          </div>
        )}

        {isChangingPlan && (
          <PlanChangeActions
            isUpgrade={isUpgrade}
            isCancelToTrial={isCancelToTrial}
            isSwitchPaidToPaid={isSwitchPaidToPaid}
            loading={loading}
            selectedPlan={selectedPlan}
            onChangePlan={handleChangePlan}
            upgradeLabel={tSettings('upgradeTo', { plan: selectedPlan.name })}
            cancelLabel={tSettings('cancelSubscription')}
            switchLabel={tSettings('switchToPlan', { plan: selectedPlan.name })}
            redirectingLabel={t('redirectingToMP')}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {isChangingPlan && selectedPlan.isPaid && (
          <span className="block">{t('securePayment')}</span>
        )}
      </p>

      <PlanChangeConfirmDialog
        confirmAction={confirmAction}
        loading={loading}
        selectedPlanName={selectedPlan.name}
        onClose={() => dispatch({ type: 'CLOSE_CONFIRM' })}
        onConfirmCancel={handleConfirmCancel}
        onConfirmSwitch={handleConfirmSwitch}
        tSettings={tSettings}
      />
    </div>
  );
}
