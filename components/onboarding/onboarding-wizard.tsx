'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  CreditCard,
  Package,
  QrCode,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Step1Personal } from './steps/step-1-personal';
import { Step2Company } from './steps/step-2-company';
import { Step3Plan } from './steps/step-3-plan';
import { Step4Products } from './steps/step-4-products';
import { Step5QR } from './steps/step-5-qr';
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';

interface Step {
  number: number;
  label: string;
  icon: React.ElementType;
  description: string;
}

const STEPS: Step[] = [
  { number: 1, label: 'Tu información', icon: User, description: 'Crea tu cuenta personal' },
  { number: 2, label: 'Tu negocio', icon: Building2, description: 'Configura tu organización' },
  { number: 3, label: 'Plan', icon: CreditCard, description: 'Elige el plan que más te convenga' },
  { number: 4, label: 'Catálogo', icon: Package, description: 'Crea categorías y premios' },
  { number: 5, label: 'Tu QR', icon: QrCode, description: 'Listo para empezar' },
];

export interface Step1CompletedData {
  firstName: string;
  lastName: string;
  email: string;
}

interface OnboardingWizardProps {
  initialStep?: number;
  /** Server-derived: true when the user is authenticated (email confirmed) */
  initialStep1Completed?: boolean;
  /** Server-derived user identity from auth metadata */
  initialUserInfo?: Step1CompletedData | null;
  /** Only present when the user already completed onboarding in a previous session */
  initialOrganizationId?: number | null;
  initialBranchId?: number | null;
  initialOrgName?: string;
}

const LS_MAX_STEP = 'onboarding_max_step';
const LS_STEP2 = 'onboarding_step2';
const LS_STEP4 = 'onboarding_step4';
const LS_PLAN = 'onboarding_plan';

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

export function OnboardingWizard({
  initialStep = 1,
  initialStep1Completed = false,
  initialUserInfo = null,
  initialOrganizationId = null,
  initialOrgName = '',
}: OnboardingWizardProps) {
  const router = useRouter();

  const clampedStep = Math.max(1, Math.min(5, initialStep));
  const [currentStep, setCurrentStep] = useState(clampedStep);
  const [maxReachedStep, setMaxReachedStep] = useState(clampedStep);

  // Collected data across steps — only written to DB atomically at step 5
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data | null>(null);
  const [step4Data, setStep4Data] = useState<OnboardingStep4Data | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('trial');

  // Derived display values
  const [organizationName, setOrganizationName] = useState<string>(initialOrgName);

  const [step1Completed, setStep1Completed] = useState(initialStep1Completed);
  const [step1Data, setStep1Data] = useState<Step1CompletedData | null>(initialUserInfo ?? null);

  useEffect(() => {
    const storedMax = parseInt(localStorage.getItem(LS_MAX_STEP) ?? '0', 10);
    if (storedMax > clampedStep) setMaxReachedStep(storedMax);

    if (!initialUserInfo) {
      const firstName = localStorage.getItem('onboarding_first_name') ?? '';
      const lastName = localStorage.getItem('onboarding_last_name') ?? '';
      const email = localStorage.getItem('onboarding_email') ?? '';
      if (firstName || email) setStep1Data({ firstName, lastName, email });
    }

    // Restore collected step data so navigation back/forth and page refreshes work
    const saved2 = lsGet<OnboardingStep2Data>(LS_STEP2);
    if (saved2) {
      setStep2Data(saved2);
      if (!initialOrgName && saved2.org.name) setOrganizationName(saved2.org.name);
    } else if (!initialOrgName) {
      const storedOrgName = localStorage.getItem('onboarding_org_name');
      if (storedOrgName) setOrganizationName(storedOrgName);
    }

    const savedPlan = localStorage.getItem(LS_PLAN);
    if (savedPlan) setSelectedPlan(savedPlan);

    const saved4 = lsGet<OnboardingStep4Data>(LS_STEP4);
    if (saved4) setStep4Data(saved4);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setMaxReachedStep((prev) => {
      const next = Math.max(prev, step);
      localStorage.setItem(LS_MAX_STEP, String(next));
      return next;
    });
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(step));
    window.history.replaceState({}, '', url.toString());
  };

  const handleStep1Next = (data?: Step1CompletedData) => {
    if (data) {
      setStep1Data(data);
      localStorage.setItem('onboarding_first_name', data.firstName);
      localStorage.setItem('onboarding_last_name', data.lastName);
      localStorage.setItem('onboarding_email', data.email);
    }
    setStep1Completed(true);
    goToStep(2);
  };

  const handleStep2Next = (data: OnboardingStep2Data) => {
    setStep2Data(data);
    setOrganizationName(data.org.name);
    lsSet(LS_STEP2, data);
    localStorage.setItem('onboarding_org_name', data.org.name);
    goToStep(3);
  };

  const handleStep3Next = (plan: string) => {
    setSelectedPlan(plan);
    localStorage.setItem(LS_PLAN, plan);
    goToStep(4);
  };

  const handleStep4Next = (data: OnboardingStep4Data | null) => {
    setStep4Data(data);
    if (data) lsSet(LS_STEP4, data);
    else localStorage.removeItem(LS_STEP4);
    goToStep(5);
  };

  const clearOnboardingLocalStorage = () => {
    [
      'onboarding_first_name',
      'onboarding_last_name',
      'onboarding_email',
      'onboarding_org_name',
      LS_PLAN,
      LS_STEP2,
      LS_STEP4,
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
    // Steps 3–5: need step 2 data in memory OR already completed (org exists from server)
    if (step >= 3) return (step2Data !== null || initialOrganizationId !== null) && maxReachedStep >= step;
    return false;
  };

  const stepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Personal
            onNext={handleStep1Next}
            completedData={step1Completed ? step1Data : null}
          />
        );
      case 2:
        return (
          <Step2Company
            onNext={handleStep2Next}
            onBack={() => goToStep(1)}
            initialData={step2Data}
          />
        );
      case 3:
        return (
          <Step3Plan
            onNext={handleStep3Next}
            onBack={() => goToStep(2)}
            initialPlan={selectedPlan}
          />
        );
      case 4:
        return (
          <Step4Products
            onNext={handleStep4Next}
            onBack={() => goToStep(3)}
            initialData={step4Data}
            onAutoSave={(data) => {
              setStep4Data(data);
              lsSet(LS_STEP4, data);
            }}
          />
        );
      case 5:
        return (
          <Step5QR
            existingOrganizationId={initialOrganizationId}
            existingOrganizationName={initialOrgName || organizationName}
            step2Data={step2Data}
            step4Data={step4Data}
            selectedPlan={selectedPlan}
            onBack={() => goToStep(2)}
            onFinish={handleFinish}
            onCreationComplete={clearOnboardingLocalStorage}
          />
        );
      default:
        return null;
    }
  };

  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Stepper Header */}
      <div className="mb-8">
        <nav aria-label="Progreso del registro">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              const isClickable = canNavigateToStep(step.number);

              return (
                <li key={step.number} className="flex flex-1 items-center">
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => isClickable && goToStep(step.number)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 focus:outline-none group',
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

                  {idx < STEPS.length - 1 && (
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

      {/* Step Card */}
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
                Paso {currentStep} de {STEPS.length}
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

      {/* Progress indicator */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-1.5">
          {STEPS.map((step) => (
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
