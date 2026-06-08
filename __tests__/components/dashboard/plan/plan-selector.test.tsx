import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { PlanSelector } from '@/components/dashboard/plan/plan-selector';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

// Mock PlanUsageSummary to avoid deep dependency
jest.mock('@/components/dashboard/plan/plan-usage-summary', () => ({
  PlanUsageSummary: () => <div data-testid="usage-summary">Usage Summary</div>,
}));

jest.mock('@/actions/dashboard/subscription/verify-subscription', () => ({
  verifySubscriptionAction: jest.fn().mockResolvedValue({ status: 'authorized', plan: 'advance' }),
}));

jest.mock('@/actions/dashboard/subscription/cancel-subscription', () => ({
  cancelSubscriptionAction: jest.fn().mockResolvedValue({ success: true, preapprovalId: 'pa_123' }),
}));

jest.mock('@/actions/dashboard/usage/actions', () => ({
  getAllPlanLimitsAction: jest.fn().mockResolvedValue({
    trial: { beneficiaries: 10, push_notifications_monthly: 3, cashiers: 1, branches: 1, collaborators: 1, redeemable_products: 2 },
    advance: { beneficiaries: 500, push_notifications_monthly: 10, cashiers: 10, branches: 5, collaborators: 3, redeemable_products: 10 },
    pro: { beneficiaries: 5000, push_notifications_monthly: 50, cashiers: 100, branches: 15, collaborators: 10, redeemable_products: 30 },
  }),
}));

// Mock @/components/ui/dialog. The backdrop drives onOpenChange(false); clicks
// inside the content stopPropagation so buttons can fire without closing.
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: { open: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) =>
    open ? (
      <div data-testid="dialog-backdrop" onClick={() => onOpenChange?.(false)}>
        <div data-testid="dialog" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { toast } = require('sonner');

describe('PlanSelector', () => {
  const mockSummary = {
    plan: 'trial',
    features: [
      {
        feature: 'beneficiaries',
        limit_value: 100,
        current_usage: 50,
        usage_percentage: 50,
        is_at_limit: false,
        should_warn: false,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
    (cancelSubscriptionAction as jest.Mock).mockResolvedValue({ success: true, preapprovalId: 'pa_123' });
  });

  it('shows loading spinner when fetching', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: true,
    });

    const { container } = render(<PlanSelector />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders plan cards when loaded', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });
    expect(screen.getByText('trialPlan')).toBeInTheDocument();
    expect(screen.getByText('advancePlan')).toBeInTheDocument();
    expect(screen.getByText('proPlan')).toBeInTheDocument();
  });

  it('shows current plan badge on active plan', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });
    // Multiple elements may have 'currentPlan' text (badge + selected indicator)
    const elements = screen.getAllByText('currentPlan');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('allows selecting a different plan', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    // Click the advance plan
    fireEvent.click(screen.getByText('advancePlan'));

    // Should show upgrade button for the newly selected plan (upgrade from trial to advance)
    expect(screen.getByText(/upgradeTo/)).toBeInTheDocument();
  });

  it('renders usage summary component', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });
    expect(screen.getByTestId('usage-summary')).toBeInTheDocument();
  });

  it('shows upgrade button when selecting a higher plan', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    // Select advance plan (upgrade from trial)
    fireEvent.click(screen.getByText('advancePlan'));

    expect(screen.getByText(/upgradeTo/)).toBeInTheDocument();
  });

  it('plan cards render as native <button> elements', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    const advanceCard = screen.getByText('advancePlan').closest('button');
    expect(advanceCard).not.toBeNull();
    expect(advanceCard?.getAttribute('type')).toBe('button');
  });

  it('shows cancel button when selecting trial from advance', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: { ...mockSummary, plan: 'advance' },
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    // Select trial plan (downgrade from advance)
    fireEvent.click(screen.getByText('trialPlan'));

    expect(screen.getByText('cancelSubscription')).toBeInTheDocument();
  });

  it('shows available plans heading', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });
    expect(screen.getByText('availablePlans')).toBeInTheDocument();
  });

  it('does nothing when clicking upgrade with no selection change', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    // Trial is already selected (current plan), no upgrade button should be shown
    // isChangingPlan is false, so the button section should not be rendered
    expect(screen.queryByText(/upgradeTo/)).not.toBeInTheDocument();
  });

  it('calls fetch and redirects on successful paid plan upgrade', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ initPoint: 'https://mp.com/pay', preapprovalId: 'pre-123' }),
    });

    await act(async () => { render(<PlanSelector />); });

    // Select advance plan (upgrade from trial)
    fireEvent.click(screen.getByText('advancePlan'));

    const upgradeButton = screen.getByText(/upgradeTo/);
    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/mercadopago/create-subscription', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('shows error toast when fetch fails', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    });

    await act(async () => { render(<PlanSelector />); });

    fireEvent.click(screen.getByText('advancePlan'));

    const upgradeButton = screen.getByText(/upgradeTo/);
    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Payment failed');
    });
  });

  it('shows error toast when fetch throws an exception', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await act(async () => { render(<PlanSelector />); });

    fireEvent.click(screen.getByText('advancePlan'));

    const upgradeButton = screen.getByText(/upgradeTo/);
    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('shows generic error toast when non-Error is thrown', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockRejectedValue('unknown');

    await act(async () => { render(<PlanSelector />); });

    fireEvent.click(screen.getByText('advancePlan'));

    const upgradeButton = screen.getByText(/upgradeTo/);
    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('paymentError');
    });
  });

  it('shows cancel button when selecting trial from a paid plan', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: { ...mockSummary, plan: 'pro' },
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    // Select trial plan (downgrade from pro) - trial is not paid
    fireEvent.click(screen.getByText('trialPlan'));

    expect(screen.getByText('cancelSubscription')).toBeInTheDocument();
  });


  it('shows upgrade button for pro plan from advance', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: { ...mockSummary, plan: 'advance' },
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });

    fireEvent.click(screen.getByText('proPlan'));

    expect(screen.getByText(/upgradeTo/)).toBeInTheDocument();
  });

  it('shows switch-to-advance button when selecting advance from pro', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: { ...mockSummary, plan: 'pro' },
      isLoading: false,
    });

    await act(async () => { render(<PlanSelector />); });
    fireEvent.click(screen.getByText('advancePlan'));
    expect(screen.getByText(/switchToPlan/)).toBeInTheDocument();
  });

  it('verifies subscription when preapproval_id is in search params (authorized)', async () => {
    window.history.replaceState(null, '', '/dashboard/settings/plan?preapproval_id=test-123');
    const { verifySubscriptionAction } = require('@/actions/dashboard/subscription/verify-subscription');
    (verifySubscriptionAction as jest.Mock).mockResolvedValue({ status: 'authorized', plan: 'pro' });

    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
      invalidate: jest.fn(),
    });

    await act(async () => { render(<PlanSelector />); });

    await waitFor(() => {
      expect(verifySubscriptionAction).toHaveBeenCalledWith('test-123');
      expect(toast.success).toHaveBeenCalledWith('planUpgraded');
    });

    window.history.replaceState(null, '', '/');
  });

  it('shows pending toast when subscription status is pending', async () => {
    window.history.replaceState(null, '', '/dashboard/settings/plan?preapproval_id=test-456');
    const { verifySubscriptionAction } = require('@/actions/dashboard/subscription/verify-subscription');
    (verifySubscriptionAction as jest.Mock).mockResolvedValue({ status: 'pending' });

    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
      invalidate: jest.fn(),
    });

    await act(async () => { render(<PlanSelector />); });

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith('paymentPending');
    });

    window.history.replaceState(null, '', '/');
  });

  it('handles verify subscription error silently', async () => {
    window.history.replaceState(null, '', '/dashboard/settings/plan?preapproval_id=test-789');
    const { verifySubscriptionAction } = require('@/actions/dashboard/subscription/verify-subscription');
    (verifySubscriptionAction as jest.Mock).mockRejectedValue(new Error('Network error'));

    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
      invalidate: jest.fn(),
    });

    await act(async () => { render(<PlanSelector />); });

    await waitFor(() => {
      expect(verifySubscriptionAction).toHaveBeenCalledWith('test-789');
    });

    // Should not throw, error is silently caught
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();

    window.history.replaceState(null, '', '/');
  });

  it('shows error when initPoint is missing from response', async () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: mockSummary,
      isLoading: false,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ preapprovalId: 'pre-123' }), // no initPoint
    });

    await act(async () => { render(<PlanSelector />); });

    fireEvent.click(screen.getByText('advancePlan'));

    const upgradeButton = screen.getByText(/upgradeTo/);
    await act(async () => {
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('paymentInitError');
    });
  });

  describe('cancel flow', () => {
    const invalidate = jest.fn();

    beforeEach(() => {
      invalidate.mockClear();
      (usePlanUsage as jest.Mock).mockReturnValue({
        summary: { ...mockSummary, plan: 'advance' },
        isLoading: false,
        invalidate,
      });
    });

    it('opens cancel confirmation dialog when cancel button is clicked', async () => {
      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      expect(screen.getByText('cancelConfirmTitle')).toBeInTheDocument();
      expect(screen.getByText('cancelConfirmDescription')).toBeInTheDocument();
      expect(screen.getByText('confirmCancel')).toBeInTheDocument();
    });

    it('cancels the subscription on confirmation', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmCancel'));
      });

      await waitFor(() => {
        expect(cancelSubscriptionAction).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith('cancelSuccess');
        expect(invalidate).toHaveBeenCalled();
      });
    });

    it('shows error toast when cancel action returns error', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      (cancelSubscriptionAction as jest.Mock).mockResolvedValueOnce({ error: 'cannot cancel' });

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmCancel'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('cannot cancel');
      });
      expect(invalidate).not.toHaveBeenCalled();
    });

    it('shows generic cancel error toast when cancel action throws', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      (cancelSubscriptionAction as jest.Mock).mockRejectedValueOnce(new Error('boom'));

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmCancel'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('cancelError');
      });
    });

    it('shows the loading label while the cancel request is in flight', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      let resolveCancel: (value: { success: true }) => void = () => {};
      (cancelSubscriptionAction as jest.Mock).mockReturnValueOnce(
        new Promise<{ success: true }>((res) => { resolveCancel = res; })
      );

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmCancel'));
      });

      expect(screen.getByText('cancelling')).toBeInTheDocument();

      await act(async () => {
        resolveCancel({ success: true });
      });
    });

    it('closes the dialog when onOpenChange is triggered (not loading)', async () => {
      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      expect(screen.getByTestId('dialog-backdrop')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByTestId('dialog-backdrop'));
      });

      expect(screen.queryByTestId('dialog-backdrop')).not.toBeInTheDocument();
    });

    it('keeps the dialog open when onOpenChange fires while loading', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      (cancelSubscriptionAction as jest.Mock).mockReturnValueOnce(
        new Promise(() => {}) // never resolves
      );

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmCancel'));
      });

      // Now loading is true; clicking the backdrop should NOT close
      await act(async () => {
        fireEvent.click(screen.getByTestId('dialog-backdrop'));
      });

      expect(screen.getByTestId('dialog-backdrop')).toBeInTheDocument();
    });

    it('closes the dialog when the "keep current plan" button is clicked', async () => {
      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('trialPlan'));
      await act(async () => {
        fireEvent.click(screen.getByText('cancelSubscription'));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('keepSubscription'));
      });

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('switch flow (pro → advance)', () => {
    const invalidate = jest.fn();

    beforeEach(() => {
      invalidate.mockClear();
      (usePlanUsage as jest.Mock).mockReturnValue({
        summary: { ...mockSummary, plan: 'pro' },
        isLoading: false,
        invalidate,
      });
    });

    it('opens switch confirmation dialog when switch button is clicked', async () => {
      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      expect(screen.getByText(/switchConfirmTitle/)).toBeInTheDocument();
      expect(screen.getByText(/switchConfirmDescription/)).toBeInTheDocument();
      expect(screen.getByText('confirmSwitch')).toBeInTheDocument();
    });

    it('cancels current plan then redirects to MercadoPago on confirmation', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ initPoint: 'https://mp.com/pay' }),
      });

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmSwitch'));
      });

      await waitFor(() => {
        expect(cancelSubscriptionAction).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith('/api/mercadopago/create-subscription', expect.objectContaining({
          method: 'POST',
        }));
      });
    });

    it('shows error toast and does not call MP when cancel returns an error', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      (cancelSubscriptionAction as jest.Mock).mockResolvedValueOnce({ error: 'cannot cancel' });

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmSwitch'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('cannot cancel');
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error toast when MercadoPago fetch throws an Error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network down'));

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmSwitch'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network down');
      });
    });

    it('shows generic paymentError toast when MercadoPago fetch throws a non-Error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce('plain string');

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmSwitch'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('paymentError');
      });
    });

    it('shows the switching loading label while the request is in flight', async () => {
      const { cancelSubscriptionAction } = require('@/actions/dashboard/subscription/cancel-subscription');
      let resolveCancel: (value: { success: true }) => void = () => {};
      (cancelSubscriptionAction as jest.Mock).mockReturnValueOnce(
        new Promise<{ success: true }>((res) => { resolveCancel = res; })
      );

      await act(async () => { render(<PlanSelector />); });

      fireEvent.click(screen.getByText('advancePlan'));
      await act(async () => {
        fireEvent.click(screen.getByText(/switchToPlan/));
      });

      await act(async () => {
        fireEvent.click(screen.getByText('confirmSwitch'));
      });

      expect(screen.getByText('switchingPlan')).toBeInTheDocument();

      await act(async () => {
        resolveCancel({ success: true });
      });
    });
  });
});
