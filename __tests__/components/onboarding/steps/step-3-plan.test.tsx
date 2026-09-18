// Las tarjetas traducen cada feature con t('features.<key>'); el stub devuelve la clave.
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${Object.values(values).join(',')}` : key;
    t.rich = (key: string) => key;
    t.has = () => true;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

// Los valores de cada plan salen de plan_limits; el server action se mockea.
jest.mock('@/actions/dashboard/usage/actions', () => ({
  getAllPlanLimitsAction: jest.fn().mockResolvedValue({
    trial:      { beneficiaries: 100,  redeemable_products: 2,  push_notifications_monthly: 200,   cashiers: 1,  branches: 1,  collaborators: 0,  campaigns: 0 },
    advance:    { beneficiaries: 1000, redeemable_products: 6,  push_notifications_monthly: 2000,  cashiers: 10, branches: 10, collaborators: 1,  campaigns: 0 },
    pro:        { beneficiaries: -1,   redeemable_products: 20, push_notifications_monthly: 5000,  cashiers: 50, branches: 50, collaborators: -1, campaigns: 1 },
    enterprise: { beneficiaries: -1,   redeemable_products: -1, push_notifications_monthly: 10000, cashiers: -1, branches: -1, collaborators: -1, campaigns: 1 },
  }),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { Step3Plan } from '@/components/onboarding/steps/step-3-plan';

const renderStep = (props: Partial<React.ComponentProps<typeof Step3Plan>> = {}) => {
  const onNext = jest.fn();
  const onBack = jest.fn();
  render(<Step3Plan onBack={onBack} onNext={onNext} {...props} />);
  return { onNext, onBack };
};

const selectPlan = (name: 'trialPlan' | 'advancePlan' | 'proPlan' | 'enterprisePlan') =>
  fireEvent.click(screen.getByText(name).closest('button') as HTMLElement);

const continueButton = () => screen.getByRole('button', { name: /continueWith/ });

const okSubscription = (body: Record<string, unknown>) =>
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => body });

describe('Step3Plan', () => {
  // The checkout hand-off assigns window.location.href, which jsdom cannot perform
  // and reports as "Not implemented: navigation". The assignment still runs; only
  // the navigation is absent, so the redirect is asserted through its side effects.
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    (global.fetch as jest.Mock).mockReset();
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders the four plans with their prices', () => {
    renderStep();

    expect(screen.getByText('trialPlan')).toBeInTheDocument();
    expect(screen.getByText('advancePlan')).toBeInTheDocument();
    expect(screen.getByText('proPlan')).toBeInTheDocument();
    expect(screen.getByText('enterprisePlan')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$89')).toBeInTheDocument();
    // Enterprise no tiene precio de lista
    expect(screen.getByText('customPriceLabel')).toBeInTheDocument();
    expect(screen.getByText('popularBadge')).toBeInTheDocument();
  });

  it('sends Enterprise to sales: the account starts on trial', () => {
    const { onNext } = renderStep();

    selectPlan('enterprisePlan');
    expect(screen.getByText('enterpriseOnboardingNote')).toBeInTheDocument();
    expect(screen.queryByLabelText('payerEmailLabel')).not.toBeInTheDocument();
    expect(continueButton()).toHaveTextContent('trialPlan');

    fireEvent.click(continueButton());
    expect(onNext).toHaveBeenCalledWith('trial');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows the unlimited label instead of a number', async () => {
    renderStep();
    // Pro tiene beneficiarios "sin límite" (-1 en plan_limits)
    await waitFor(() => expect(screen.getAllByText('unlimited').length).toBeGreaterThan(0));
  });

  it('preselects the trial plan and marks it as selected', () => {
    renderStep();
    expect(screen.getByText('selectedPlan')).toBeInTheDocument();
    expect(continueButton()).toHaveTextContent('trialPlan');
  });

  it('honors the plan restored from a previous session', () => {
    renderStep({ initialPlan: 'pro' });
    expect(continueButton()).toHaveTextContent('proPlan');
  });

  it('falls back to the first plan when the stored id is unknown', () => {
    renderStep({ initialPlan: 'inventado' });
    expect(continueButton()).toHaveTextContent('trialPlan');
  });

  it('advances immediately for the free plan without contacting MercadoPago', () => {
    const { onNext } = renderStep();

    fireEvent.click(continueButton());

    expect(onNext).toHaveBeenCalledWith('trial');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('goes back to the previous step', () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('asks for the payer email only on a paid plan', () => {
    renderStep();
    expect(screen.queryByLabelText('payerEmailLabel')).not.toBeInTheDocument();

    selectPlan('advancePlan');
    expect(screen.getByLabelText('payerEmailLabel')).toBeInTheDocument();
    expect(screen.getByText('securePayment')).toBeInTheDocument();
  });

  it('prefills the payer email with the address collected in step 1', () => {
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });
    expect(screen.getByLabelText('payerEmailLabel')).toHaveValue('ana@example.com');
  });

  it('rejects a malformed payer email before calling the API', () => {
    renderStep({ initialPlan: 'pro' });

    fireEvent.change(screen.getByLabelText('payerEmailLabel'), { target: { value: 'no-arroba' } });
    fireEvent.click(continueButton());

    expect(toast.error).toHaveBeenCalledWith('payerEmailInvalid');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('redirects to MercadoPago and stores the plan and preapproval id', async () => {
    okSubscription({ initPoint: 'https://mp/checkout', preapprovalId: 'pre-1' });
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(localStorage.getItem('onboarding_plan')).toBe('pro'));
    expect(global.fetch).toHaveBeenCalledWith('/api/mercadopago/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: 'pro', payerEmail: 'ana@example.com' }),
    });
    expect(localStorage.getItem('mp_preapproval_id')).toBe('pre-1');
  });

  it('redirects even when MercadoPago returns no preapproval id', async () => {
    okSubscription({ initPoint: 'https://mp/checkout' });
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(localStorage.getItem('onboarding_plan')).toBe('pro'));
    expect(localStorage.getItem('mp_preapproval_id')).toBeNull();
  });

  it('trims the payer email before sending it', async () => {
    okSubscription({ initPoint: 'https://mp/checkout' });
    renderStep({ initialPlan: 'pro' });

    fireEvent.change(screen.getByLabelText('payerEmailLabel'), {
      target: { value: '  ana@example.com  ' },
    });
    fireEvent.click(continueButton());

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).payerEmail).toBe('ana@example.com');
  });

  it('surfaces the API error message on a failed response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Plan agotado' }) });
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Plan agotado'));
  });

  it('falls back to a generic message when the failed response is unreadable', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => { throw new Error('not json'); },
    });
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('paymentInitError'));
  });

  it('reports a success response that carries no checkout url', async () => {
    okSubscription({ error: 'Sin checkout' });
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sin checkout'));
  });

  it('falls back to a generic message when there is neither url nor error', async () => {
    okSubscription({});
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('paymentInitError'));
  });

  it('locks the controls while the checkout is being created', async () => {
    let finish: (r: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    renderStep({ initialPlan: 'pro', userEmail: 'ana@example.com' });

    fireEvent.click(continueButton());

    await waitFor(() => expect(screen.getByText('redirectingToMP')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'back' })).toBeDisabled();
    expect(screen.getByLabelText('payerEmailLabel')).toBeDisabled();

    finish({ ok: true, json: async () => ({ initPoint: 'https://mp/checkout' }) });
    await waitFor(() => expect(localStorage.getItem('onboarding_plan')).toBe('pro'));
  });

  it('renders boolean features as a tick or a dash', async () => {
    const { container } = render(<Step3Plan onBack={jest.fn()} onNext={jest.fn()} />);
    // trial tiene campaigns=0 (guion) y pro campaigns=1 (tilde)
    await waitFor(() => expect(screen.getAllByText('-').length).toBeGreaterThan(0));
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
