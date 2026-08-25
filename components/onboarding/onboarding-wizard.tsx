'use client';

import React, { useEffect, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  CreditCard,
  FileText,
  Package,
  QrCode,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ClubiSidebar } from '@/components/onboarding/clubi-sidebar';
import { cn } from '@/lib/utils';

import { Step1Personal } from './steps/step-1-personal';
import { Step2Company } from './steps/step-2-company';
import { Step3Plan } from './steps/step-3-plan';
import { Step4Products } from './steps/step-4-products';
import { Step5Consent } from './steps/step-5-consent';
import { Step5QR } from './steps/step-5-qr';
import { clearOnboardingLocalStorage, LS_MAX_STEP } from '@/lib/onboarding-storage';
import type { Step1CompletedData } from './wizard-state';
import { computeInitialWizardState, wizardReducer } from './wizard-state';

interface OnboardingWizardProps {
  initialStep?: number;
  initialStep1Completed?: boolean;
  initialUserInfo?: Step1CompletedData | null;
  initialOrganizationId?: number | null;
  initialBranchId?: number | null;
  initialOrgName?: string;
}

// ─── Step Nav ─────────────────────────────────────────────────────────────────

interface StepDef {
  number: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function StepNav({ steps, currentStep, canNavigateToStep, onGoToStep }: {
  steps: StepDef[];
  currentStep: number;
  canNavigateToStep: (step: number) => boolean;
  onGoToStep: (step: number) => void;
}) {
  const t = useTranslations('Onboarding.wizard');
  return (
    <nav aria-label={t('progress')}>
      <ol className="flex items-center">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = canNavigateToStep(step.number);
          return (
            <li key={step.number} className="contents">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onGoToStep(step.number)}
                className={cn(
                  'flex flex-col items-center gap-1.5 focus:outline-none group shrink-0',
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className={cn(
                  'flex size-9 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent ? 'border-primary bg-white dark:bg-card text-primary'
                    : 'border-muted-foreground/30 bg-white dark:bg-card text-muted-foreground/50'
                )}>
                  {isCompleted ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span className={cn(
                  'hidden sm:block text-xs font-medium leading-tight text-center max-w-16',
                  isCurrent ? 'text-primary'
                    : isCompleted ? 'text-primary'
                    : 'text-muted-foreground/50'
                )}>
                  {step.label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 transition-all',
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                )} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingWizard({
  initialStep = 1,
  initialStep1Completed = false,
  initialUserInfo = null,
  initialOrganizationId = null,
  initialOrgName = '',
}: OnboardingWizardProps) {
  const { push } = useRouter();
  const t = useTranslations('Onboarding.wizard');

  const steps = [
    { number: 1, label: t('steps.personalInfo'), icon: User, description: t('stepDescriptions.personalInfo') },
    { number: 2, label: t('steps.business'), icon: Building2, description: t('stepDescriptions.business') },
    { number: 3, label: t('steps.plan'), icon: CreditCard, description: t('stepDescriptions.plan') },
    { number: 4, label: t('steps.catalog'), icon: Package, description: t('stepDescriptions.catalog') },
    { number: 5, label: t('steps.terms'), icon: FileText, description: t('stepDescriptions.terms') },
    { number: 6, label: t('steps.qr'), icon: QrCode, description: t('stepDescriptions.qr') },
  ];

  // `?step=abc` reaches here as NaN, which would slip past the clamp and land on
  // the last step (the switch fallback), so non-finite input restarts at step 1.
  const clampedStep = Number.isFinite(initialStep) ? Math.max(1, Math.min(6, initialStep)) : 1;

  const [state, dispatch] = useReducer(
    wizardReducer,
    undefined,
    () => computeInitialWizardState({
      clampedStep,
      initialStep1Completed,
      initialUserInfo,
      initialOrganizationId,
      initialOrgName,
    })
  );

  const {
    currentStep, maxReachedStep, step1Completed, step1Data,
    step2Data, step4Data, selectedPlan, mpPreapprovalId,
    organizationName, consentGiven,
  } = state;

  // Sync currentStep & maxReachedStep to URL and localStorage as a side effect
  useEffect(() => {
    localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(currentStep));
    window.history.replaceState({}, '', url.toString());
  }, [currentStep, maxReachedStep]);

  // Clear the 'step' query param on first mount (it was hydrated above into state).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('step')) {
      url.searchParams.delete('step');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);


  const goToStep = (step: number) => {
    dispatch({ type: 'GO_TO_STEP', step });
  };

  const handleFinish = () => {
    clearOnboardingLocalStorage();
    push('/dashboard');
  };

  const canNavigateToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return step1Completed || maxReachedStep >= 2;
    if (step >= 3 && step <= 5) return (step2Data !== null || initialOrganizationId !== null) && maxReachedStep >= step;
    // step 6 additionally needs consent
    return (step2Data !== null || initialOrganizationId !== null) && consentGiven && maxReachedStep >= 6;
  };

  const stepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Personal
            onNext={(data) => dispatch({ type: 'COMPLETE_STEP1', data })}
            completedData={step1Completed ? step1Data : null}
          />
        );
      case 2:
        return (
          <Step2Company
            onNext={(data) => dispatch({ type: 'COMPLETE_STEP2', data })}
            onBack={() => goToStep(1)}
            initialData={step2Data}
          />
        );
      case 3:
        return (
          <Step3Plan
            onNext={(plan) => dispatch({ type: 'COMPLETE_STEP3', plan })}
            onBack={() => goToStep(2)}
            initialPlan={selectedPlan}
            userEmail={step1Data?.email ?? ''}
          />
        );
      case 4:
        return (
          <Step4Products
            onNext={(data) => dispatch({ type: 'COMPLETE_STEP4', data })}
            onBack={() => goToStep(3)}
            initialData={step4Data}
            onAutoSave={(data) => dispatch({ type: 'SET_STEP4_DATA', data })}
            selectedPlan={selectedPlan}
          />
        );
      case 5:
        return (
          <Step5Consent
            onNext={() => dispatch({ type: 'COMPLETE_CONSENT' })}
            onBack={() => goToStep(4)}
            initialConsent={consentGiven}
          />
        );
      // currentStep is clamped to 1-6, so step 6 doubles as the fallback
      default:
        return (
          <Step5QR
            existingOrganizationId={initialOrganizationId}
            existingOrganizationName={initialOrgName || organizationName}
            step2Data={step2Data}
            step4Data={step4Data}
            selectedPlan={selectedPlan}
            mpPreapprovalId={mpPreapprovalId}
            onBack={() => goToStep(5)}
            onFinish={handleFinish}
            onCreationComplete={clearOnboardingLocalStorage}
          />
        );
    }
  };

  const currentStepInfo = steps[currentStep - 1];

  // Términos ocupa todo el ancho: es el único paso sin acompañamiento de Clubi.
  const showClubi = currentStep !== 5;

  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 ${currentStep === 3 ? 'max-w-6xl' : showClubi ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <div className="mb-8">
        <StepNav steps={steps} currentStep={currentStep} canNavigateToStep={canNavigateToStep} onGoToStep={goToStep} />
      </div>

      <div className={showClubi ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]' : ''}>
      <div className="min-w-0 rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              {currentStepInfo && (
                <currentStepInfo.icon className="size-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('step', { current: currentStep, total: steps.length })}
              </p>
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                {currentStepInfo?.label}
              </h1>
            </div>
          </div>
          {currentStepInfo?.description && (
            <p className="mt-2 text-sm text-muted-foreground ml-[3.25rem]">
              {currentStepInfo.description}
            </p>
          )}
        </div>

        <div className="p-6">{stepContent()}</div>
      </div>

      {showClubi && <ClubiSidebar step={currentStep} />}
      </div>

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                'h-1.5 rounded-full transition-all',
                currentStep === step.number
                  ? 'w-6 bg-primary'
                  : currentStep > step.number
                  ? 'w-1.5 bg-primary/60'
                  : 'w-1.5 bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
