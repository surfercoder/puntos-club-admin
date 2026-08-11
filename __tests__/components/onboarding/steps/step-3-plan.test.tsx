// The plan grid reads its feature labels through t.raw('features'), so this suite
// needs a richer translator than the global stub.
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${Object.values(values).join(',')}` : key;
    t.rich = (key: string) => key;
    t.raw = () => ({
      rewards: 'Premios',
      beneficiaries: 'Beneficiarios',
      notificationsPerMonth: 'Notificaciones',
      cashiers: 'Cajeros',
      branches: 'Sucursales',
      collaborators: 'Colaboradores',
      beneficiaryMap: 'Mapa',
      dashboard: 'Dashboard',
      excelPdfExport: 'Exportación',
      customAI: 'IA',
      businessIntelligence: 'BI',
    });
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
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

const selectPlan = (name: 'trialPlan' | 'advancePlan' | 'proPlan') =>
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

  it('renders the three plans with their prices', () => {
    renderStep();

    expect(screen.getByText('trialPlan')).toBeInTheDocument();
    expect(screen.getByText('advancePlan')).toBeInTheDocument();
    expect(screen.getByText('proPlan')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
    expect(screen.getByText('$89')).toBeInTheDocument();
    expect(screen.getByText('popularBadge')).toBeInTheDocument();
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

  it('renders boolean features as a tick or a dash', () => {
    const { container } = render(<Step3Plan onBack={jest.fn()} onNext={jest.fn()} />);
    // the trial plan has beneficiaryMap=false (dash) and pro has it true (tick)
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
});
