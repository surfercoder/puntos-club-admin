'use client';

import { useEffect, useReducer } from 'react';
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
import { cn } from '@/lib/utils';

import { Step1Personal } from './steps/step-1-personal';
import { Step2Company } from './steps/step-2-company';
import { Step3Plan } from './steps/step-3-plan';
import { Step4Products } from './steps/step-4-products';
import { Step5Consent } from './steps/step-5-consent';
import { Step5QR } from './steps/step-5-qr';
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';

export interface Step1CompletedData {
  firstName: string;
  lastName: string;
  email: string;
}

interface OnboardingWizardProps {
  initialStep?: number;
  initialStep1Completed?: boolean;
  initialUserInfo?: Step1CompletedData | null;
  initialOrganizationId?: number | null;
  initialBranchId?: number | null;
  initialOrgName?: string;
}

const LS_MAX_STEP = 'onboarding_max_step';
const LS_STEP2 = 'onboarding_step2';
const LS_STEP4 = 'onboarding_step4';
const LS_PLAN = 'onboarding_plan';
const LS_MP_PREAPPROVAL_ID = 'mp_preapproval_id';
const LS_CONSENT = 'onboarding_consent';

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

interface WizardState {
  currentStep: number;
  maxReachedStep: number;
  step1Completed: boolean;
  step1Data: Step1CompletedData | null;
  step2Data: OnboardingStep2Data | null;
  step4Data: OnboardingStep4Data | null;
  selectedPlan: string;
  mpPreapprovalId: string | null;
  organizationName: string;
  consentGiven: boolean;
}

type WizardAction =
  | { type: 'HYDRATE_FROM_LS'; payload: Partial<WizardState> }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'COMPLETE_STEP1'; data?: Step1CompletedData }
  | { type: 'COMPLETE_STEP2'; data: OnboardingStep2Data }
  | { type: 'COMPLETE_STEP3'; plan: string }
  | { type: 'COMPLETE_STEP4'; data: OnboardingStep4Data | null }
  | { type: 'COMPLETE_CONSENT' }
  | { type: 'SET_STEP4_DATA'; data: OnboardingStep4Data };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'HYDRATE_FROM_LS':
      return { ...state, ...action.payload };

    case 'GO_TO_STEP': {
      const maxReachedStep = Math.max(state.maxReachedStep, action.step);
      localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(action.step));
      window.history.replaceState({}, '', url.toString());
      return { ...state, currentStep: action.step, maxReachedStep };
    }

    case 'COMPLETE_STEP1': {
      const next: WizardState = {
        ...state,
        step1Completed: true,
        currentStep: 2,
        maxReachedStep: Math.max(state.maxReachedStep, 2),
      };
      if (action.data) {
        next.step1Data = action.data;
        localStorage.setItem('onboarding_first_name', action.data.firstName);
        localStorage.setItem('onboarding_last_name', action.data.lastName);
        localStorage.setItem('onboarding_email', action.data.email);
      }
      localStorage.setItem(LS_MAX_STEP, String(next.maxReachedStep));
      return next;
    }

    case 'COMPLETE_STEP2': {
      lsSet(LS_STEP2, action.data);
      localStorage.setItem('onboarding_org_name', action.data.org.name);
      const maxReachedStep = Math.max(state.maxReachedStep, 3);
      localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
      return {
        ...state,
        step2Data: action.data,
        organizationName: action.data.org.name,
        currentStep: 3,
        maxReachedStep,
      };
    }

    case 'COMPLETE_STEP3': {
      localStorage.setItem(LS_PLAN, action.plan);
      const maxReachedStep = Math.max(state.maxReachedStep, 4);
      localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
      return { ...state, selectedPlan: action.plan, currentStep: 4, maxReachedStep };
    }

    case 'COMPLETE_STEP4': {
      if (action.data) lsSet(LS_STEP4, action.data);
      else localStorage.removeItem(LS_STEP4);
      const maxReachedStep = Math.max(state.maxReachedStep, 5);
      localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
      return { ...state, step4Data: action.data, currentStep: 5, maxReachedStep };
    }

    case 'COMPLETE_CONSENT': {
      const maxReachedStep = Math.max(state.maxReachedStep, 6);
      localStorage.setItem(LS_MAX_STEP, String(maxReachedStep));
      return { ...state, consentGiven: true, currentStep: 6, maxReachedStep };
    }

    case 'SET_STEP4_DATA':
      lsSet(LS_STEP4, action.data);
      return { ...state, step4Data: action.data };

    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingWizard({
  initialStep = 1,
  initialStep1Completed = false,
  initialUserInfo = null,
  initialOrganizationId = null,
  initialOrgName = '',
}: OnboardingWizardProps) {
  const router = useRouter();
  const t = useTranslations('Onboarding.wizard');

  const steps = [
    { number: 1, label: t('steps.personalInfo'), icon: User, description: t('stepDescriptions.personalInfo') },
    { number: 2, label: t('steps.business'), icon: Building2, description: t('stepDescriptions.business') },
    { number: 3, label: t('steps.plan'), icon: CreditCard, description: t('stepDescriptions.plan') },
    { number: 4, label: t('steps.catalog'), icon: Package, description: t('stepDescriptions.catalog') },
    { number: 5, label: t('steps.terms'), icon: FileText, description: t('stepDescriptions.terms') },
    { number: 6, label: t('steps.qr'), icon: QrCode, description: t('stepDescriptions.qr') },
  ];

  const clampedStep = Math.max(1, Math.min(6, initialStep));

  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: clampedStep,
    maxReachedStep: clampedStep,
    step1Completed: initialStep1Completed,
    step1Data: initialUserInfo ?? null,
    step2Data: null,
    step4Data: null,
    selectedPlan: 'trial',
    mpPreapprovalId: null,
    organizationName: initialOrgName,
    consentGiven: false,
  });

  const {
    currentStep, maxReachedStep, step1Completed, step1Data,
    step2Data, step4Data, selectedPlan, mpPreapprovalId,
    organizationName, consentGiven,
  } = state;

  useEffect(() => {
    const payload: Partial<WizardState> = {};

    const storedMax = parseInt(localStorage.getItem(LS_MAX_STEP) ?? '0', 10);
    if (storedMax > clampedStep) payload.maxReachedStep = storedMax;

    if (!initialUserInfo) {
      const firstName = localStorage.getItem('onboarding_first_name') ?? '';
      const lastName = localStorage.getItem('onboarding_last_name') ?? '';
      const email = localStorage.getItem('onboarding_email') ?? '';
      if (firstName || email) payload.step1Data = { firstName, lastName, email };
    }

    const saved2 = lsGet<OnboardingStep2Data>(LS_STEP2);
    if (saved2) {
      payload.step2Data = saved2;
      if (!initialOrgName && saved2.org.name) payload.organizationName = saved2.org.name;
    } else if (!initialOrgName) {
      const storedOrgName = localStorage.getItem('onboarding_org_name');
      if (storedOrgName) payload.organizationName = storedOrgName;
    }

    const savedPlan = localStorage.getItem(LS_PLAN);
    if (savedPlan) payload.selectedPlan = savedPlan;

    const savedMpId = localStorage.getItem(LS_MP_PREAPPROVAL_ID);
    if (savedMpId) payload.mpPreapprovalId = savedMpId;

    const saved4 = lsGet<OnboardingStep4Data>(LS_STEP4);
    if (saved4) payload.step4Data = saved4;

    const savedConsent = localStorage.getItem(LS_CONSENT);
    if (savedConsent === 'true') payload.consentGiven = true;

    if (Object.keys(payload).length > 0) {
      dispatch({ type: 'HYDRATE_FROM_LS', payload });
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has('step')) {
      url.searchParams.delete('step');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const goToStep = (step: number) => {
    dispatch({ type: 'GO_TO_STEP', step });
  };

  const clearOnboardingLocalStorage = () => {
    [
      'onboarding_first_name',
      'onboarding_last_name',
      'onboarding_email',
      'onboarding_org_name',
      LS_PLAN,
      LS_MP_PREAPPROVAL_ID,
      LS_STEP2,
      LS_STEP4,
      LS_CONSENT,
      LS_MAX_STEP,
    ].forEach((key) => localStorage.removeItem(key));
  };

  const handleFinish = () => {
    clearOnboardingLocalStorage();
    router.push('/dashboard');
  };

  const canNavigateToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return step1Completed || maxReachedStep >= 2;
    if (step >= 3 && step <= 4) return (step2Data !== null || initialOrganizationId !== null) && maxReachedStep >= step;
    if (step === 5) return (step2Data !== null || initialOrganizationId !== null) && maxReachedStep >= 5;
    if (step === 6) return (step2Data !== null || initialOrganizationId !== null) && consentGiven && maxReachedStep >= 6;
    return false;
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
          />
        );
      case 4:
        return (
          <Step4Products
            onNext={(data) => dispatch({ type: 'COMPLETE_STEP4', data })}
            onBack={() => goToStep(3)}
            initialData={step4Data}
            onAutoSave={(data) => dispatch({ type: 'SET_STEP4_DATA', data })}
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
      case 6:
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
      default:
        return null;
    }
  };

  const currentStepInfo = steps[currentStep - 1];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
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
                    onClick={() => isClickable && goToStep(step.number)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 focus:outline-none group shrink-0',
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                        isCompleted
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isCurrent
                          ? 'border-emerald-600 bg-white dark:bg-gray-900 text-emerald-600'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-400'
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span
                      className={cn(
                        'hidden sm:block text-xs font-medium leading-tight text-center max-w-16',
                        isCurrent
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isCompleted
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </button>

                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2 transition-all',
                        currentStep > step.number ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                      aria-hidden
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="rounded-2xl border bg-white dark:bg-gray-900 shadow-sm">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              {currentStepInfo && (
                <currentStepInfo.icon className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('step', { current: currentStep, total: steps.length })}
              </p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
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

      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                'h-1.5 rounded-full transition-all',
                currentStep === step.number
                  ? 'w-6 bg-emerald-600'
                  : currentStep > step.number
                  ? 'w-1.5 bg-emerald-400'
                  : 'w-1.5 bg-gray-200 dark:bg-gray-700'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
