// State, persistence and reducer for the onboarding wizard. Kept out of the
// component file so the wizard stays a component-only module.
import type { OnboardingStep2Data, OnboardingStep4Data } from '@/actions/onboarding/actions';
import {
  LS_MAX_STEP,
  LS_STEP2,
  LS_STEP4,
  LS_PLAN,
  LS_MP_PREAPPROVAL_ID,
  LS_CONSENT,
  LS_EMAIL,
  clearOnboardingLocalStorage,
} from '@/lib/onboarding-storage';

export interface Step1CompletedData {
  firstName: string;
  lastName: string;
  email: string;
}

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

interface ComputeInitialWizardStateArgs {
  clampedStep: number;
  initialStep1Completed: boolean;
  initialUserInfo: Step1CompletedData | null;
  initialOrganizationId: number | null;
  initialOrgName: string;
}

/** Exported so the server-render path (no `window`) can be covered directly. */
export function computeInitialWizardState({
  clampedStep,
  initialStep1Completed,
  initialUserInfo,
  initialOrganizationId,
  initialOrgName,
}: ComputeInitialWizardStateArgs): WizardState {
  const base: WizardState = {
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
  };

  if (typeof window === 'undefined') return base;

  // If the authenticated user isn't the one this saved onboarding belongs to,
  // it's stale from a previous account — wipe it so nothing leaks across users.
  if (initialUserInfo?.email) {
    const storedEmail = localStorage.getItem(LS_EMAIL);
    if (storedEmail && storedEmail.toLowerCase() !== initialUserInfo.email.toLowerCase()) {
      clearOnboardingLocalStorage();
      return base;
    }
  }

  const storedMaxRaw = parseInt(localStorage.getItem(LS_MAX_STEP) ?? '0', 10);
  if (!initialOrganizationId && storedMaxRaw >= 6) {
    clearOnboardingLocalStorage();
    return base;
  }

  const next: WizardState = { ...base };

  if (storedMaxRaw > clampedStep) next.maxReachedStep = storedMaxRaw;

  if (!initialUserInfo) {
    const firstName = localStorage.getItem('onboarding_first_name') ?? '';
    const lastName = localStorage.getItem('onboarding_last_name') ?? '';
    const email = localStorage.getItem('onboarding_email') ?? '';
    if (firstName || email) next.step1Data = { firstName, lastName, email };
  }

  const saved2 = lsGet<OnboardingStep2Data>(LS_STEP2);
  if (saved2) {
    next.step2Data = saved2;
    if (!initialOrgName && saved2.org.name) next.organizationName = saved2.org.name;
  } else if (!initialOrgName) {
    const storedOrgName = localStorage.getItem('onboarding_org_name');
    if (storedOrgName) next.organizationName = storedOrgName;
  }

  const savedPlan = localStorage.getItem(LS_PLAN);
  if (savedPlan) next.selectedPlan = savedPlan;

  const savedMpId = localStorage.getItem(LS_MP_PREAPPROVAL_ID);
  if (savedMpId) next.mpPreapprovalId = savedMpId;

  const saved4 = lsGet<OnboardingStep4Data>(LS_STEP4);
  if (saved4) next.step4Data = saved4;

  const savedConsent = localStorage.getItem(LS_CONSENT);
  if (savedConsent === 'true') next.consentGiven = true;

  return next;
}

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
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'COMPLETE_STEP1'; data?: Step1CompletedData }
  | { type: 'COMPLETE_STEP2'; data: OnboardingStep2Data }
  | { type: 'COMPLETE_STEP3'; plan: string }
  | { type: 'COMPLETE_STEP4'; data: OnboardingStep4Data | null }
  | { type: 'COMPLETE_CONSENT' }
  | { type: 'SET_STEP4_DATA'; data: OnboardingStep4Data };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'GO_TO_STEP': {
      const maxReachedStep = Math.max(state.maxReachedStep, action.step);
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
  }
}
