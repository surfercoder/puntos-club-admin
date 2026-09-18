'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
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
import { PlanCards, type PlanLimitsByPlan } from '@/components/plan/plan-cards';
import {
  PLAN_ORDER,
  isContactSalesPlan,
  isPaidPlan,
  planButtonColorMap,
  planColor,
} from '@/lib/plans/config';
import { getAllPlanLimitsAction } from '@/actions/dashboard/usage/actions';
import { verifySubscriptionAction } from '@/actions/dashboard/subscription/verify-subscription';
import { cancelSubscriptionAction } from '@/actions/dashboard/subscription/cancel-subscription';
import type { PlanType } from '@/types/plan';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ChangePlanState = {
  selected: PlanType | null;
  loading: boolean;
  confirmAction: 'cancel' | 'switch' | null;
};

type ChangePlanAction =
  | { type: 'SET_SELECTED'; payload: PlanType | null }
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
  isContactSales: boolean;
  loading: boolean;
  selectedPlan: PlanType;
  onChangePlan: () => void;
  upgradeLabel: string;
  cancelLabel: string;
  switchLabel: string;
  contactSalesLabel: string;
  redirectingLabel: string;
}

function PlanChangeActions({
  isUpgrade,
  isCancelToTrial,
  isSwitchPaidToPaid,
  isContactSales,
  loading,
  selectedPlan,
  onChangePlan,
  upgradeLabel,
  cancelLabel,
  switchLabel,
  contactSalesLabel,
  redirectingLabel,
}: PlanChangeActionsProps) {
  const colorClass = planButtonColorMap[planColor(selectedPlan)];

  // Enterprise no tiene checkout: se cierra hablando con nosotros.
  if (isContactSales) {
    return (
      <div className="mt-3">
        <Button asChild className={cn('w-full text-xs', colorClass)}>
          <a href="mailto:soporte@puntosclub.com.ar?subject=Plan%20Enterprise">
            {contactSalesLabel}
            <ArrowRight className="ml-1.5 size-3" />
          </a>
        </Button>
      </div>
    );
  }
  if (isUpgrade) {
    return (
      <div className="mt-3">
        <Button
          className={cn('w-full text-xs', colorClass)}
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
  // one of the flags above, so this fallthrough is unreachable. It exists
  // only to satisfy the type checker.
  /* c8 ignore start */
  if (!isSwitchPaidToPaid) return null;
  /* c8 ignore stop */
  return (
    <div className="mt-3">
      <Button
        className={cn('w-full text-xs', colorClass)}
        onClick={onChangePlan}
        disabled={loading}
      >
        {switchLabel}
        <ArrowRight className="ml-1.5 size-3" />
      </Button>
    </div>
  );
}

// findIndex ya devuelve -1 para null: "antes que cualquier plan".
const planRank = (plan: PlanType | null) => PLAN_ORDER.findIndex((p) => p === plan);

function derivePlanChangeFlags(selected: PlanType | null, currentPlan: PlanType | null) {
  const isChangingPlan = selected !== currentPlan;
  // Entrar o salir de Enterprise pasa por comercial, nunca por Mercado Pago.
  const isContactSales =
    isChangingPlan &&
    ((selected !== null && isContactSalesPlan(selected)) ||
      (currentPlan !== null && isContactSalesPlan(currentPlan)));
  const isUpgrade =
    isChangingPlan &&
    !isContactSales &&
    selected !== null &&
    isPaidPlan(selected) &&
    planRank(selected) > planRank(currentPlan);
  const isCancelToTrial =
    isChangingPlan && !isContactSales && selected === 'trial' && currentPlan !== 'trial';
  const isSwitchPaidToPaid =
    isChangingPlan &&
    !isContactSales &&
    selected !== null &&
    currentPlan !== null &&
    isPaidPlan(selected) &&
    isPaidPlan(currentPlan) &&
    planRank(selected) < planRank(currentPlan);

  return { isChangingPlan, isContactSales, isUpgrade, isCancelToTrial, isSwitchPaidToPaid };
}

async function startCheckoutForSelected(
  selected: string | null,
  payerEmail: string,
  t: ReturnType<typeof useTranslations>
) {
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
}

function buildPlanChangeHandlers({
  selected,
  payerEmail,
  isChangingPlan,
  isUpgrade,
  isCancelToTrial,
  isSwitchPaidToPaid,
  dispatch,
  invalidate,
  t,
  tSettings,
}: {
  selected: string | null;
  payerEmail: string;
  isChangingPlan: boolean;
  isUpgrade: boolean;
  isCancelToTrial: boolean;
  isSwitchPaidToPaid: boolean;
  dispatch: React.Dispatch<ChangePlanAction>;
  invalidate: () => void;
  t: ReturnType<typeof useTranslations>;
  tSettings: ReturnType<typeof useTranslations>;
}) {
  const handleChangePlan = async () => {
    /* c8 ignore next */
    if (!selected || !isChangingPlan) return;

    if (isUpgrade) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await startCheckoutForSelected(selected, payerEmail, t);
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
      await startCheckoutForSelected(selected, payerEmail, t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('paymentError'));
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return { handleChangePlan, handleConfirmCancel, handleConfirmSwitch };
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
  const [planLimits, setPlanLimits] = useState<PlanLimitsByPlan | null>(null);
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

  const selectedPlan = selected ?? PLAN_ORDER[0];
  const selectedPlanName = t(`${selectedPlan}Plan`);
  const { isChangingPlan, isContactSales, isUpgrade, isCancelToTrial, isSwitchPaidToPaid } =
    derivePlanChangeFlags(selected, currentPlan);

  const { handleChangePlan, handleConfirmCancel, handleConfirmSwitch } = buildPlanChangeHandlers({
    selected,
    payerEmail,
    isChangingPlan,
    isUpgrade,
    isCancelToTrial,
    isSwitchPaidToPaid,
    dispatch,
    invalidate,
    t,
    tSettings,
  });

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

        <PlanCards
          limits={planLimits}
          selected={selected}
          currentPlan={currentPlan}
          onSelect={(plan) => dispatch({ type: 'SET_SELECTED', payload: plan })}
        />

        {isChangingPlan && (isUpgrade || isSwitchPaidToPaid) && (
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
            isContactSales={isContactSales}
            loading={loading}
            selectedPlan={selectedPlan}
            onChangePlan={handleChangePlan}
            upgradeLabel={tSettings('upgradeTo', { plan: selectedPlanName })}
            cancelLabel={tSettings('cancelSubscription')}
            switchLabel={tSettings('switchToPlan', { plan: selectedPlanName })}
            contactSalesLabel={tSettings('contactSales')}
            redirectingLabel={t('redirectingToMP')}
          />
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {t('allPlansInclude')} {t('changePlanAnytime')}
        {isChangingPlan && (isUpgrade || isSwitchPaidToPaid) && (
          <span className="block">{t('securePayment')}</span>
        )}
      </p>

      <PlanChangeConfirmDialog
        confirmAction={confirmAction}
        loading={loading}
        selectedPlanName={selectedPlanName}
        onClose={() => dispatch({ type: 'CLOSE_CONFIRM' })}
        onConfirmCancel={handleConfirmCancel}
        onConfirmSwitch={handleConfirmSwitch}
        tSettings={tSettings}
      />
    </div>
  );
}
