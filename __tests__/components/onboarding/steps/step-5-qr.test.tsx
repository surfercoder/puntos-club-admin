jest.mock('@/actions/onboarding/actions', () => ({ completeOnboarding: jest.fn() }));
jest.mock('@/components/dashboard/qr/qr-preview-card', () => ({
  QRPreviewCard: ({ qrData, organizationName }: { qrData: string; organizationName: string }) => (
    <div data-testid="qr-preview" data-org={organizationName}>
      {qrData}
    </div>
  ),
}));
jest.mock('@/components/mobile-apps/app-download-qr-cards', () => ({
  AppDownloadQRCards: () => <div data-testid="app-qr-cards" />,
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { completeOnboarding } from '@/actions/onboarding/actions';
import { Step5QR } from '@/components/onboarding/steps/step-5-qr';

const step2Data = { org: { name: 'Kiosco Ana' } } as never;
const step4Data = { products: ['a'] } as never;

const renderStep = (props: Partial<React.ComponentProps<typeof Step5QR>> = {}) => {
  const onBack = jest.fn();
  const onFinish = jest.fn();
  const onCreationComplete = jest.fn();
  const utils = render(
    <Step5QR
      onBack={onBack}
      onCreationComplete={onCreationComplete}
      onFinish={onFinish}
      step2Data={step2Data}
      {...props}
    />,
  );
  return { ...utils, onBack, onFinish, onCreationComplete };
};

describe('Step5QR', () => {
  beforeEach(() => {
    // mockReset, not clear: a leftover mockResolvedValueOnce would leak otherwise
    jest.mocked(completeOnboarding).mockReset();
    jest.mocked(completeOnboarding).mockResolvedValue({
      success: true,
      data: { organizationId: 7, orgName: 'Kiosco Ana' },
    });
  });

  it('shows the QR straight away for an organization that already exists', () => {
    const { onCreationComplete } = renderStep({
      existingOrganizationId: 7,
      existingOrganizationName: 'Kiosco Ana',
    });

    expect(screen.getByTestId('qr-preview')).toHaveAttribute('data-org', 'Kiosco Ana');
    expect(completeOnboarding).not.toHaveBeenCalled();
    // nothing was created in this session, so no completion callback
    expect(onCreationComplete).not.toHaveBeenCalled();
  });

  it('defaults the org name to empty when the server did not supply one', () => {
    renderStep({ existingOrganizationId: 7 });
    expect(screen.getByTestId('qr-preview')).toHaveAttribute('data-org', '');
  });

  it('asks the user to go back when step 2 data is missing', () => {
    const { onBack } = renderStep({ step2Data: null });

    expect(screen.getByText('somethingWentWrong')).toBeInTheDocument();
    expect(completeOnboarding).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /reviewBack/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('creates the organization and then shows the QR', async () => {
    const { onCreationComplete } = renderStep({
      selectedPlan: 'pro',
      mpPreapprovalId: 'pre-1',
      step4Data,
    });

    expect(screen.getByText('settingUp')).toBeInTheDocument();

    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
    expect(completeOnboarding).toHaveBeenCalledWith({
      step2: step2Data,
      plan: 'pro',
      mpPreapprovalId: 'pre-1',
      step4: step4Data,
    });
    expect(onCreationComplete).toHaveBeenCalledTimes(1);
  });

  it('encodes the organization identity into the QR payload', async () => {
    renderStep();

    const qr = await screen.findByTestId('qr-preview');
    expect(JSON.parse(qr.textContent as string)).toEqual({
      type: 'organization',
      id: 7,
      name: 'Kiosco Ana',
    });
  });

  it('normalises a null preapproval id to undefined for the action', async () => {
    renderStep({ mpPreapprovalId: null });

    await screen.findByTestId('qr-preview');
    expect(jest.mocked(completeOnboarding).mock.calls[0][0].mpPreapprovalId).toBeUndefined();
  });

  it('creates the organization exactly once even across re-renders', async () => {
    const { rerender } = renderStep();
    rerender(
      <Step5QR onBack={jest.fn()} onFinish={jest.fn()} step2Data={step2Data} />,
    );

    await screen.findByTestId('qr-preview');
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it('reports the server error and retries on demand', async () => {
    jest.mocked(completeOnboarding).mockResolvedValueOnce({ success: false, error: 'Plan inválido' });
    renderStep();

    expect(await screen.findByText('Plan inválido')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /tryAgain/ }));

    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
    expect(completeOnboarding).toHaveBeenCalledTimes(2);
  });

  it('falls back to a generic message when the server sends no error text', async () => {
    jest.mocked(completeOnboarding).mockResolvedValue({ success: false });
    renderStep();

    expect(await screen.findByText('Error desconocido.')).toBeInTheDocument();
  });

  it('treats a success payload with no data as an error', async () => {
    jest.mocked(completeOnboarding).mockResolvedValue({ success: true });
    renderStep();

    expect(await screen.findByText('Error desconocido.')).toBeInTheDocument();
  });

  it('reports a network failure', async () => {
    jest.mocked(completeOnboarding).mockRejectedValue(new Error('offline'));
    renderStep();

    expect(await screen.findByText('Error de conexión. Por favor intenta de nuevo.')).toBeInTheDocument();
  });

  it('goes back from the error screen', async () => {
    jest.mocked(completeOnboarding).mockResolvedValue({ success: false, error: 'Plan inválido' });
    const { onBack } = renderStep();
    await screen.findByText('Plan inválido');

    fireEvent.click(screen.getByRole('button', { name: /reviewBack/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('finishes to the dashboard from the QR screen', async () => {
    const { onFinish } = renderStep();
    await screen.findByTestId('qr-preview');

    fireEvent.click(screen.getByRole('button', { name: 'goToDashboard' }));
    expect(onFinish).toHaveBeenCalled();
  });

  it('offers the app download codes alongside the org QR', async () => {
    renderStep();
    expect(await screen.findByTestId('app-qr-cards')).toBeInTheDocument();
  });

  it('skips the state update when unmounted mid-creation', async () => {
    let finish: (r: unknown) => void = () => {};
    jest.mocked(completeOnboarding).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderStep();
    unmount();
    finish({ success: true, data: { organizationId: 7, orgName: 'Kiosco Ana' } });

    await waitFor(() => expect(completeOnboarding).toHaveBeenCalled());
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('works without the optional creation callback', async () => {
    render(<Step5QR onBack={jest.fn()} onFinish={jest.fn()} step2Data={step2Data} />);
    expect(await screen.findByTestId('qr-preview')).toBeInTheDocument();
  });
});
