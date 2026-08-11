/**
 * @jest-environment node
 *
 * On the server there is no localStorage to hydrate from, so the wizard has to
 * fall back to the props alone. jsdom always defines `window`, hence a node env.
 */
import { computeInitialWizardState } from '@/components/onboarding/wizard-state';

describe('computeInitialWizardState on the server', () => {
  it('builds the state from the props alone, without touching storage', () => {
    expect(
      computeInitialWizardState({
        clampedStep: 3,
        initialStep1Completed: true,
        initialUserInfo: { firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' },
        initialOrganizationId: 7,
        initialOrgName: 'Kiosco Ana',
      }),
    ).toEqual({
      currentStep: 3,
      maxReachedStep: 3,
      step1Completed: true,
      step1Data: { firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' },
      step2Data: null,
      step4Data: null,
      selectedPlan: 'trial',
      mpPreapprovalId: null,
      organizationName: 'Kiosco Ana',
      consentGiven: false,
    });
  });
});
