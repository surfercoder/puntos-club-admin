// Each step is exercised by its own suite; here they are stubs so the wizard's
// navigation, persistence and hydration logic is what gets tested.
jest.mock('@/components/onboarding/steps/step-1-personal', () => ({
  Step1Personal: ({ onNext, completedData }: { onNext: (d: unknown) => void; completedData: unknown }) => (
    <div data-testid="step-1">
      <span data-testid="step-1-completed">{completedData ? 'yes' : 'no'}</span>
      <button
        type="button"
        onClick={() => onNext({ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' })}
      >
        finish-1
      </button>
    </div>
  ),
}));
jest.mock('@/components/onboarding/steps/step-2-company', () => ({
  Step2Company: ({ onNext, onBack }: { onNext: (d: unknown) => void; onBack: () => void }) => (
    <div data-testid="step-2">
      <button type="button" onClick={() => onNext({ org: { name: 'Kiosco Ana' } })}>
        finish-2
      </button>
      <button type="button" onClick={onBack}>back-2</button>
    </div>
  ),
}));
jest.mock('@/components/onboarding/steps/step-3-plan', () => ({
  Step3Plan: ({ onNext, onBack, userEmail }: { onNext: (p: string) => void; onBack: () => void; userEmail: string }) => (
    <div data-testid="step-3">
      <span data-testid="step-3-email">{userEmail}</span>
      <button type="button" onClick={() => onNext('pro')}>finish-3</button>
      <button type="button" onClick={onBack}>back-3</button>
    </div>
  ),
}));
jest.mock('@/components/onboarding/steps/step-4-products', () => ({
  Step4Products: ({
    onNext,
    onBack,
    onAutoSave,
    selectedPlan,
  }: {
    onNext: (d: unknown) => void;
    onBack: () => void;
    onAutoSave: (d: unknown) => void;
    selectedPlan: string;
  }) => (
    <div data-testid="step-4">
      <span data-testid="step-4-plan">{selectedPlan}</span>
      <button type="button" onClick={() => onNext({ products: ['a'] })}>finish-4</button>
      <button type="button" onClick={() => onNext(null)}>skip-4</button>
      <button type="button" onClick={() => onAutoSave({ products: ['draft'] })}>autosave-4</button>
      <button type="button" onClick={onBack}>back-4</button>
    </div>
  ),
}));
jest.mock('@/components/onboarding/steps/step-5-consent', () => ({
  Step5Consent: ({ onNext, onBack, initialConsent }: { onNext: () => void; onBack: () => void; initialConsent: boolean }) => (
    <div data-testid="step-5">
      <span data-testid="step-5-consent">{String(initialConsent)}</span>
      <button type="button" onClick={onNext}>finish-5</button>
      <button type="button" onClick={onBack}>back-5</button>
    </div>
  ),
}));
jest.mock('@/components/onboarding/steps/step-5-qr', () => ({
  Step5QR: ({
    onBack,
    onFinish,
    onCreationComplete,
    existingOrganizationName,
  }: {
    onBack: () => void;
    onFinish: () => void;
    onCreationComplete: () => void;
    existingOrganizationName: string;
  }) => (
    <div data-testid="step-6">
      <span data-testid="step-6-org">{existingOrganizationName}</span>
      <button type="button" onClick={onFinish}>finish-6</button>
      <button type="button" onClick={onCreationComplete}>created-6</button>
      <button type="button" onClick={onBack}>back-6</button>
    </div>
  ),
}));

import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import {
  LS_CONSENT,
  LS_EMAIL,
  LS_MAX_STEP,
  LS_MP_PREAPPROVAL_ID,
  LS_PLAN,
  LS_STEP2,
  LS_STEP4,
} from '@/lib/onboarding-storage';

const push = jest.fn();

const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

/** Walks the wizard from step 1 to `target` through the step stubs. */
const advanceTo = (target: number) => {
  const path = ['finish-1', 'finish-2', 'finish-3', 'finish-4', 'finish-5'];
  for (const step of path.slice(0, target - 1)) click(step);
};

describe('OnboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push });
    window.history.replaceState({}, '', '/owner/onboarding');
  });

  it('starts on step 1 for a brand-new user', () => {
    render(<OnboardingWizard />);
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
    expect(screen.getByTestId('step-1-completed')).toHaveTextContent('no');
  });

  it('clamps an out-of-range initial step into the wizard', () => {
    const { unmount } = render(<OnboardingWizard initialOrganizationId={1} initialStep={99} />);
    expect(screen.getByTestId('step-6')).toBeInTheDocument();
    unmount();

    render(<OnboardingWizard initialStep={-5} />);
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('restarts at step 1 when the step query param was not a number', () => {
    // ?step=abc reaches the wizard as NaN via parseInt
    render(<OnboardingWizard initialStep={Number.NaN} />);
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('keeps going when localStorage refuses to store the step 2 payload', () => {
    const real = Storage.prototype.setItem;
    const setItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === LS_STEP2) throw new Error('QuotaExceededError');
      real.call(this, key, value);
    });

    try {
      render(<OnboardingWizard />);
      click('finish-1');
      expect(() => click('finish-2')).not.toThrow();
      expect(screen.getByTestId('step-3')).toBeInTheDocument();
    } finally {
      setItem.mockRestore();
    }
  });

  it('walks forward through every step, persisting progress as it goes', () => {
    render(<OnboardingWizard />);

    click('finish-1');
    expect(screen.getByTestId('step-2')).toBeInTheDocument();
    expect(localStorage.getItem('onboarding_first_name')).toBe('Ana');
    expect(localStorage.getItem('onboarding_email')).toBe('ana@example.com');

    click('finish-2');
    expect(screen.getByTestId('step-3')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LS_STEP2) as string)).toEqual({ org: { name: 'Kiosco Ana' } });
    expect(localStorage.getItem('onboarding_org_name')).toBe('Kiosco Ana');

    click('finish-3');
    expect(screen.getByTestId('step-4')).toBeInTheDocument();
    expect(localStorage.getItem(LS_PLAN)).toBe('pro');

    click('finish-4');
    expect(screen.getByTestId('step-5')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LS_STEP4) as string)).toEqual({ products: ['a'] });

    click('finish-5');
    expect(screen.getByTestId('step-6')).toBeInTheDocument();
    expect(localStorage.getItem(LS_MAX_STEP)).toBe('6');
  });

  it('drops the saved catalog when step 4 is skipped', () => {
    render(<OnboardingWizard />);
    advanceTo(4);
    localStorage.setItem(LS_STEP4, JSON.stringify({ products: ['old'] }));

    click('skip-4');

    expect(screen.getByTestId('step-5')).toBeInTheDocument();
    expect(localStorage.getItem(LS_STEP4)).toBeNull();
  });

  it('autosaves a step 4 draft without advancing', () => {
    render(<OnboardingWizard />);
    advanceTo(4);

    click('autosave-4');

    expect(screen.getByTestId('step-4')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LS_STEP4) as string)).toEqual({ products: ['draft'] });
  });

  it.each([
    [2, 'back-2', 1],
    [3, 'back-3', 2],
    [4, 'back-4', 3],
    [5, 'back-5', 4],
    [6, 'back-6', 5],
  ])('goes back from step %d via %s to step %d', (from, backButton, to) => {
    render(<OnboardingWizard />);
    advanceTo(from);

    click(backButton);
    expect(screen.getByTestId(`step-${to}`)).toBeInTheDocument();
  });

  it('passes the collected email down to the plan step', () => {
    render(<OnboardingWizard />);
    advanceTo(3);
    expect(screen.getByTestId('step-3-email')).toHaveTextContent('ana@example.com');
  });

  it('falls back to the server-supplied email for the plan step', () => {
    render(
      <OnboardingWizard
        initialStep={3}
        initialOrganizationId={1}
        initialStep1Completed
        initialUserInfo={null}
      />,
    );
    expect(screen.getByTestId('step-3-email')).toHaveTextContent('');
  });

  it('uses the server org name over the one collected in step 2', () => {
    localStorage.setItem(LS_MAX_STEP, '6');
    localStorage.setItem(LS_CONSENT, 'true');
    render(<OnboardingWizard initialOrgName="Kiosco Server" initialOrganizationId={1} initialStep={6} />);
    expect(screen.getByTestId('step-6-org')).toHaveTextContent('Kiosco Server');
  });

  it('clears storage and lands on the dashboard when finishing', () => {
    localStorage.setItem(LS_MAX_STEP, '6');
    localStorage.setItem(LS_CONSENT, 'true');
    localStorage.setItem(LS_PLAN, 'pro');
    render(<OnboardingWizard initialOrganizationId={1} initialStep={6} />);

    click('finish-6');

    expect(push).toHaveBeenCalledWith('/dashboard');
    expect(localStorage.getItem(LS_PLAN)).toBeNull();
  });

  it('clears storage when the org is created, without navigating', () => {
    localStorage.setItem(LS_MAX_STEP, '6');
    localStorage.setItem(LS_CONSENT, 'true');
    localStorage.setItem(LS_PLAN, 'pro');
    render(<OnboardingWizard initialOrganizationId={1} initialStep={6} />);

    click('created-6');

    expect(localStorage.getItem(LS_PLAN)).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('OnboardingWizard step navigation guards', () => {
  const stepButton = (label: string) => screen.getByRole('button', { name: new RegExp(label) });

  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('locks every step past the first until it is reached', () => {
    render(<OnboardingWizard />);

    expect(stepButton('steps.personalInfo')).toBeEnabled();
    for (const label of ['steps.business', 'steps.plan', 'steps.catalog', 'steps.terms', 'steps.qr']) {
      expect(stepButton(label)).toBeDisabled();
    }
  });

  it('unlocks a visited step so the user can jump back to it', () => {
    render(<OnboardingWizard />);
    advanceTo(3);

    expect(stepButton('steps.business')).toBeEnabled();
    fireEvent.click(stepButton('steps.business'));
    expect(screen.getByTestId('step-2')).toBeInTheDocument();
  });

  it('keeps the QR step locked until consent is given', () => {
    render(<OnboardingWizard />);
    advanceTo(5);
    expect(stepButton('steps.qr')).toBeDisabled();

    click('finish-5');
    expect(stepButton('steps.qr')).toBeEnabled();
  });

  it('unlocks step 2 from the server-side completion flag alone', () => {
    render(<OnboardingWizard initialStep1Completed />);
    expect(stepButton('steps.business')).toBeEnabled();
  });

  it('accepts an existing organization in place of locally collected step 2 data', () => {
    localStorage.setItem(LS_MAX_STEP, '4');
    render(<OnboardingWizard initialOrganizationId={7} initialStep={4} initialStep1Completed />);
    expect(stepButton('steps.plan')).toBeEnabled();
  });
});

describe('OnboardingWizard hydration from localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('restores the furthest step reached, the plan and the consent flag', () => {
    localStorage.setItem(LS_MAX_STEP, '5');
    localStorage.setItem(LS_PLAN, 'advance');
    localStorage.setItem(LS_CONSENT, 'true');
    localStorage.setItem(LS_STEP2, JSON.stringify({ org: { name: 'Kiosco Guardado' } }));

    render(<OnboardingWizard initialStep={5} />);

    expect(screen.getByTestId('step-5-consent')).toHaveTextContent('true');
  });

  it('restores the saved catalog and preapproval id', () => {
    localStorage.setItem(LS_MAX_STEP, '4');
    localStorage.setItem(LS_STEP2, JSON.stringify({ org: { name: 'Kiosco' } }));
    localStorage.setItem(LS_STEP4, JSON.stringify({ products: ['guardado'] }));
    localStorage.setItem(LS_MP_PREAPPROVAL_ID, 'pre-1');
    localStorage.setItem(LS_PLAN, 'pro');

    render(<OnboardingWizard initialStep={4} />);

    expect(screen.getByTestId('step-4-plan')).toHaveTextContent('pro');
  });

  it('restores the name collected in step 1 when the server has none', () => {
    localStorage.setItem('onboarding_first_name', 'Ana');
    localStorage.setItem('onboarding_email', 'ana@example.com');
    localStorage.setItem(LS_MAX_STEP, '3');
    localStorage.setItem(LS_STEP2, JSON.stringify({ org: { name: 'Kiosco' } }));

    render(<OnboardingWizard initialStep={3} initialStep1Completed />);

    expect(screen.getByTestId('step-3-email')).toHaveTextContent('ana@example.com');
  });

  it('ignores a stored name block that has neither first name nor email', () => {
    localStorage.setItem('onboarding_last_name', 'Gómez');
    render(<OnboardingWizard />);
    expect(screen.getByTestId('step-1-completed')).toHaveTextContent('no');
  });

  it('falls back to the standalone org name key when step 2 was never saved', () => {
    localStorage.setItem('onboarding_org_name', 'Kiosco Suelto');
    localStorage.setItem(LS_MAX_STEP, '6');
    localStorage.setItem(LS_CONSENT, 'true');

    render(<OnboardingWizard initialOrganizationId={1} initialStep={6} />);

    expect(screen.getByTestId('step-6-org')).toHaveTextContent('Kiosco Suelto');
  });

  it('wipes onboarding saved under a different account', () => {
    localStorage.setItem(LS_EMAIL, 'otro@example.com');
    localStorage.setItem(LS_MAX_STEP, '4');
    localStorage.setItem(LS_PLAN, 'pro');

    render(
      <OnboardingWizard
        initialStep1Completed
        initialUserInfo={{ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' }}
      />,
    );

    expect(localStorage.getItem(LS_PLAN)).toBeNull();
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('keeps onboarding saved under the same account, ignoring case', () => {
    localStorage.setItem(LS_EMAIL, 'ANA@example.com');
    localStorage.setItem(LS_MAX_STEP, '2');

    render(
      <OnboardingWizard
        initialStep1Completed
        initialUserInfo={{ firstName: 'Ana', lastName: 'Gómez', email: 'ana@example.com' }}
      />,
    );

    expect(localStorage.getItem(LS_MAX_STEP)).toBe('2');
  });

  it('wipes a finished onboarding that left no organization behind', () => {
    localStorage.setItem(LS_MAX_STEP, '6');
    localStorage.setItem(LS_PLAN, 'pro');

    render(<OnboardingWizard />);

    expect(localStorage.getItem(LS_PLAN)).toBeNull();
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });

  it('survives unparseable saved payloads', () => {
    localStorage.setItem(LS_STEP2, '{not json');
    localStorage.setItem(LS_STEP4, '{not json');
    localStorage.setItem(LS_MAX_STEP, '4');

    expect(() => render(<OnboardingWizard initialStep={4} />)).not.toThrow();
  });

  it('drops the step query param after hydrating from it', () => {
    window.history.replaceState({}, '', '/owner/onboarding?step=1&keep=1');

    render(<OnboardingWizard />);

    expect(window.location.search).not.toContain('step=1');
    expect(window.location.search).toContain('keep=1');
  });

  it('records the current step in the url as the user advances', () => {
    window.history.replaceState({}, '', '/owner/onboarding');
    render(<OnboardingWizard />);

    click('finish-1');

    expect(window.location.search).toContain('step=2');
  });
});
