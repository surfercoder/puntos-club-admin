// Single source of truth for the localStorage keys the onboarding wizard uses,
// so both the wizard and step 1 clear the exact same set (no drift, no
// circular import between the two components).

export const LS_FIRST_NAME = 'onboarding_first_name';
export const LS_LAST_NAME = 'onboarding_last_name';
export const LS_EMAIL = 'onboarding_email';
export const LS_ORG_NAME = 'onboarding_org_name';
export const LS_PLAN = 'onboarding_plan';
export const LS_MP_PREAPPROVAL_ID = 'mp_preapproval_id';
export const LS_STEP2 = 'onboarding_step2';
export const LS_STEP4 = 'onboarding_step4';
export const LS_CONSENT = 'onboarding_consent';
export const LS_MAX_STEP = 'onboarding_max_step';

const ALL_KEYS = [
  LS_FIRST_NAME,
  LS_LAST_NAME,
  LS_EMAIL,
  LS_ORG_NAME,
  LS_PLAN,
  LS_MP_PREAPPROVAL_ID,
  LS_STEP2,
  LS_STEP4,
  LS_CONSENT,
  LS_MAX_STEP,
];

export function clearOnboardingLocalStorage() {
  ALL_KEYS.forEach((key) => localStorage.removeItem(key));
}
