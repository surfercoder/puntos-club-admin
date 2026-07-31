import {
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
  clearOnboardingLocalStorage,
} from '@/lib/onboarding-storage';

describe('lib/onboarding-storage', () => {
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

  it('removes every onboarding key and leaves unrelated keys intact', () => {
    ALL_KEYS.forEach((key) => localStorage.setItem(key, 'x'));
    localStorage.setItem('unrelated', 'keep');

    clearOnboardingLocalStorage();

    ALL_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
