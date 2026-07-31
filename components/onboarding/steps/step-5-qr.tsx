'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, PartyPopper, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { QRPreviewCard } from '@/components/dashboard/qr/qr-preview-card';
import { AppDownloadQRCards } from '@/components/mobile-apps/app-download-qr-cards';
import { completeOnboarding } from '@/actions/onboarding/actions';
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';

interface Step5Props {
  existingOrganizationId?: number | null;
  existingOrganizationName?: string;
  step2Data?: OnboardingStep2Data | null;
  step4Data?: OnboardingStep4Data | null;
  selectedPlan?: string;
  mpPreapprovalId?: string | null;
  onBack: () => void;
  onFinish: () => void;
  onCreationComplete?: () => void;
}

type State =
  | { status: 'creating' }
  | { status: 'success'; organizationId: number; orgName: string }
  | { status: 'error'; message: string }
  | { status: 'missing_data' };

async function runCreation(
  step2: OnboardingStep2Data,
  plan: string | undefined,
  mpPreapprovalId: string | null | undefined,
  step4: OnboardingStep4Data | null | undefined,
): Promise<State> {
  try {
    const result = await completeOnboarding({ step2, plan, mpPreapprovalId: mpPreapprovalId ?? undefined, step4 });
    return result.success && result.data
      ? { status: 'success', organizationId: result.data.organizationId, orgName: result.data.orgName }
      : { status: 'error', message: result.error ?? 'Error desconocido.' };
  } catch {
    return { status: 'error', message: 'Error de conexión. Por favor intenta de nuevo.' };
  }
}

// ─── Status screens ──────────────────────────────────────────────────────────

function CreatingScreen({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">{t('settingUp')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{t('settingUpDescription')}</p>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <span>{t('creatingOrg')}</span>
        <span>{t('registeringBranch')}</span>
        <span>{t('configuringPoints')}</span>
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onBack,
  onRetry,
  t,
}: {
  message: string;
  onBack: () => void;
  onRetry: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertCircle className="size-10 text-red-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">{t('somethingWentWrong')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
        <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
          <ArrowLeft className="size-4" />
          {t('reviewBack')}
        </Button>
        <Button type="button" className="gap-2" onClick={onRetry}>
          <RefreshCw className="size-4" />
          {t('tryAgain')}
        </Button>
      </div>
    </div>
  );
}

function MissingDataScreen({ onBack, t }: { onBack: () => void; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-brand-orange/10">
        <AlertCircle className="size-10 text-brand-orange" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-foreground">{t('somethingWentWrong')}</h3>
      </div>
      <Button type="button" variant="outline" className="gap-2" onClick={onBack}>
        <ArrowLeft className="size-4" />
        {t('reviewBack')}
      </Button>
    </div>
  );
}

// ─── QR Success view ─────────────────────────────────────────────────────────

function QRSuccessView({
  organizationId,
  orgName,
  onFinish,
  t,
}: {
  organizationId: number;
  orgName: string;
  onFinish: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const qrData = JSON.stringify({ type: 'organization', id: organizationId, name: orgName });

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-green/10">
          <PartyPopper className="size-8 text-brand-green" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{t('businessReady')}</h3>
      </div>

      <section className="space-y-3">
        <div className="text-center">
          <h4 className="font-semibold text-foreground">{t('orgQrTitle')}</h4>
          <p className="text-sm text-muted-foreground">{t('orgQrDescription')}</p>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <QRPreviewCard qrData={qrData} organizationName={orgName} logoUrl={null} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-center">
          <h4 className="font-semibold text-foreground">{t('downloadAppsTitle')}</h4>
          <p className="text-sm text-muted-foreground">{t('downloadAppsDescription')}</p>
        </div>
        <AppDownloadQRCards />
      </section>

      <div className="flex justify-center pt-2">
        <Button type="button" className="min-w-48" onClick={onFinish}>
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function Step5QR({
  existingOrganizationId,
  existingOrganizationName,
  step2Data,
  step4Data,
  selectedPlan,
  mpPreapprovalId,
  onBack,
  onFinish,
  onCreationComplete,
}: Step5Props) {
  const t = useTranslations('Onboarding.step6');
  // ponytail: the promise is created once and cached in this ref, so the
  // non-idempotent completeOnboarding call fires exactly once even under
  // StrictMode's dev remount. Each effect run subscribes with its own `active`
  // flag, so the real result is always applied (no stuck spinner) while a
  // genuine unmount safely skips the setState.
  const creationRef = useRef<Promise<State> | null>(null);
  const prevStatusRef = useRef<State['status'] | null>(null);

  const [state, setState] = useState<State>(() => {
    if (existingOrganizationId) {
      return { status: 'success', organizationId: existingOrganizationId, orgName: existingOrganizationName ?? '' };
    }
    if (!step2Data) return { status: 'missing_data' };
    return { status: 'creating' };
  });

  useEffect(() => {
    if (state.status !== 'creating') return;

    let active = true;
    const creation =
      creationRef.current ??
      (creationRef.current = runCreation(step2Data!, selectedPlan, mpPreapprovalId, step4Data));
    creation.then((nextState) => {
      if (active) setState(nextState);
    });

    return () => {
      active = false;
    };
  }, [state.status, step2Data, selectedPlan, mpPreapprovalId, step4Data]);

  useEffect(() => {
    if (prevStatusRef.current === 'creating' && state.status === 'success') {
      onCreationComplete?.();
    }
    prevStatusRef.current = state.status;
  }, [state.status, onCreationComplete]);

  const handleRetry = () => {
    creationRef.current = null;
    setState({ status: 'creating' });
  };

  if (state.status === 'creating') return <CreatingScreen t={t} />;
  if (state.status === 'error') return <ErrorScreen message={state.message} onBack={onBack} onRetry={handleRetry} t={t} />;
  if (state.status === 'missing_data') return <MissingDataScreen onBack={onBack} t={t} />;

  return (
    <QRSuccessView
      organizationId={state.organizationId}
      orgName={state.orgName}
      onFinish={onFinish}
      t={t}
    />
  );
}
