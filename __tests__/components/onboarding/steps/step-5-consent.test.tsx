jest.mock('@/actions/onboarding/verify-captcha', () => ({ verifyCaptchaToken: jest.fn() }));

// A stand-in for the real widget: exposes buttons that fire the same callbacks
// and records reset() so the "clear the captcha" behaviour can be asserted.
const captchaReset = jest.fn();
jest.mock('react-google-recaptcha', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const MockReCAPTCHA = forwardRef(
    (
      props: {
        onChange: (token: string | null) => void;
        onErrored: () => void;
        onExpired: () => void;
      },
      ref: unknown,
    ) => {
      useImperativeHandle(ref, () => ({ reset: captchaReset }));
      return (
        <div>
          <button type="button" onClick={() => props.onChange('captcha-token')}>captcha-solve</button>
          <button type="button" onClick={() => props.onChange(null)}>captcha-empty</button>
          <button type="button" onClick={props.onErrored}>captcha-error</button>
          <button type="button" onClick={props.onExpired}>captcha-expire</button>
        </div>
      );
    },
  );
  MockReCAPTCHA.displayName = 'ReCAPTCHA';
  return { __esModule: true, default: MockReCAPTCHA };
});

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { verifyCaptchaToken } from '@/actions/onboarding/verify-captcha';
import { Step5Consent } from '@/components/onboarding/steps/step-5-consent';

const LS_CONSENT = 'onboarding_consent';

const renderStep = (props: Partial<React.ComponentProps<typeof Step5Consent>> = {}) => {
  const onNext = jest.fn();
  const onBack = jest.fn();
  render(<Step5Consent onBack={onBack} onNext={onNext} {...props} />);
  return { onNext, onBack };
};

const termsBox = () => document.querySelector('.overflow-y-auto') as HTMLElement;

/** Fakes the geometry jsdom does not compute, then scrolls the terms box. */
const scrollTerms = (to: 'bottom' | 'middle') => {
  const el = termsBox();
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: 300 });
  Object.defineProperty(el, 'scrollTop', { configurable: true, value: to === 'bottom' ? 700 : 100 });
  fireEvent.scroll(el);
};

const consentCheckbox = () => screen.getByRole('checkbox');
const continueButton = () => screen.getByRole('button', { name: /continue|verifying/ });
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

const acceptTerms = () => {
  scrollTerms('bottom');
  fireEvent.click(consentCheckbox());
};

describe('Step5Consent', () => {
  beforeEach(() => {
    localStorage.clear();
    captchaReset.mockClear();
    jest.mocked(verifyCaptchaToken).mockResolvedValue({ success: true });
  });

  // Storage spies below must come back even when an assertion throws first.
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the consent checkbox locked until the terms are scrolled through', () => {
    renderStep();

    expect(consentCheckbox()).toBeDisabled();
    expect(screen.getByText('scrollPrompt')).toBeInTheDocument();

    scrollTerms('bottom');

    expect(consentCheckbox()).toBeEnabled();
    expect(screen.queryByText('scrollPrompt')).not.toBeInTheDocument();
  });

  it('stays locked while the user is only partway down', () => {
    renderStep();
    scrollTerms('middle');
    expect(consentCheckbox()).toBeDisabled();
  });

  it('ignores further scrolling once the bottom was already reached', () => {
    renderStep();
    scrollTerms('bottom');
    scrollTerms('middle');
    expect(consentCheckbox()).toBeEnabled();
  });

  it('shows the captcha only after consent is given', () => {
    renderStep();
    expect(screen.queryByRole('button', { name: 'captcha-solve' })).not.toBeInTheDocument();

    acceptTerms();
    expect(screen.getByRole('button', { name: 'captcha-solve' })).toBeInTheDocument();
    expect(localStorage.getItem(LS_CONSENT)).toBe('true');
  });

  it('withdrawing consent hides the captcha, resets it and clears storage', () => {
    renderStep();
    acceptTerms();

    fireEvent.click(consentCheckbox());

    expect(screen.queryByRole('button', { name: 'captcha-solve' })).not.toBeInTheDocument();
    expect(captchaReset).toHaveBeenCalled();
    expect(localStorage.getItem(LS_CONSENT)).toBeNull();
  });

  it('restores a consent saved in a previous session', async () => {
    localStorage.setItem(LS_CONSENT, 'true');
    renderStep();

    expect(await screen.findByRole('button', { name: 'captcha-solve' })).toBeInTheDocument();
    expect(consentCheckbox()).toBeChecked();
  });

  it('restores consent handed down by the wizard', async () => {
    renderStep({ initialConsent: true });
    expect(await screen.findByRole('button', { name: 'captcha-solve' })).toBeInTheDocument();
  });

  it('starts fresh when nothing was stored', () => {
    renderStep();
    expect(consentCheckbox()).not.toBeChecked();
  });

  it('starts fresh when localStorage cannot be read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    renderStep();
    expect(consentCheckbox()).not.toBeChecked();
  });

  it('keeps going when localStorage cannot be written', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    renderStep();
    expect(() => acceptTerms()).not.toThrow();
    expect(screen.getByRole('button', { name: 'captcha-solve' })).toBeInTheDocument();
  });

  it('enables continue once the captcha is solved', () => {
    renderStep();
    acceptTerms();
    expect(continueButton()).toBeDisabled();

    click('captcha-solve');

    expect(continueButton()).toBeEnabled();
    expect(screen.getByText('allDone')).toBeInTheDocument();
    expect(screen.getByText(/Verificación completada/)).toBeInTheDocument();
  });

  it('ignores an empty captcha callback', () => {
    renderStep();
    acceptTerms();

    click('captcha-empty');

    expect(continueButton()).toBeDisabled();
  });

  it('reports a captcha that failed to load', () => {
    renderStep();
    acceptTerms();

    click('captcha-error');

    expect(screen.getByText(/Error al cargar el captcha/)).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
  });

  it('reports an expired captcha', () => {
    renderStep();
    acceptTerms();
    click('captcha-solve');

    click('captcha-expire');

    expect(screen.getByText(/El captcha expiró/)).toBeInTheDocument();
    expect(continueButton()).toBeDisabled();
  });

  it('verifies the token server-side and advances', async () => {
    const { onNext } = renderStep();
    acceptTerms();
    click('captcha-solve');

    fireEvent.click(continueButton());

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(verifyCaptchaToken).toHaveBeenCalledWith('captcha-token');
  });

  it('shows the verifying state and locks both buttons while in flight', async () => {
    let finish: (r: unknown) => void = () => {};
    jest.mocked(verifyCaptchaToken).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderStep();
    acceptTerms();
    click('captcha-solve');

    fireEvent.click(continueButton());

    expect(await screen.findByText('verifying')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/ })).toBeDisabled();

    await act(async () => { finish({ success: true }); });
  });

  it('surfaces the server rejection and resets the captcha', async () => {
    jest.mocked(verifyCaptchaToken).mockResolvedValue({ success: false, error: 'Token inválido' });
    const { onNext } = renderStep();
    acceptTerms();
    click('captcha-solve');

    fireEvent.click(continueButton());

    expect(await screen.findByText(/Token inválido/)).toBeInTheDocument();
    expect(captchaReset).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('falls back to a generic rejection message', async () => {
    jest.mocked(verifyCaptchaToken).mockResolvedValue({ success: false });
    renderStep();
    acceptTerms();
    click('captcha-solve');

    fireEvent.click(continueButton());

    expect(await screen.findByText(/Verificación fallida/)).toBeInTheDocument();
  });

  it('reports an unexpected verification failure', async () => {
    jest.mocked(verifyCaptchaToken).mockRejectedValue(new Error('offline'));
    const { onNext } = renderStep();
    acceptTerms();
    click('captcha-solve');

    fireEvent.click(continueButton());

    expect(await screen.findByText(/Error inesperado/)).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('goes back to the previous step', () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole('button', { name: /back/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('renders the full terms text', () => {
    renderStep();
    expect(screen.getByText(/Términos y Condiciones de Uso: Puntos Club/)).toBeInTheDocument();
    expect(screen.getByText(/legal@puntosclub.com/)).toBeInTheDocument();
  });
});
