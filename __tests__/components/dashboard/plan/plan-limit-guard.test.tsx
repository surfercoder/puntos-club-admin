import { render, screen } from '@testing-library/react';
import { PlanLimitGuard } from '@/components/dashboard/plan/plan-limit-guard';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

// The global mock for usePlanUsage is already set up in jest.setup.js

describe('PlanLimitGuard', () => {
  const defaultProps = {
    features: ['branches' as const],
    backHref: '/dashboard/branch',
    children: <div data-testid="children">Protected content</div>,
  };

  it('renders children when not at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 0, is_at_limit: false },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => false),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('renders children while loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: true,
      isAtLimit: jest.fn(() => false),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('blocks when feature is at limit (any mode)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 1, is_at_limit: true },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn((f: string) => f === 'branches'),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    expect(screen.getByText('limitReachedTitle')).toBeInTheDocument();
  });

  it('blocks when all features are at limit (all mode)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 1, is_at_limit: true },
          { feature: 'beneficiaries', limit_value: 100, current_usage: 100, is_at_limit: true },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(
      <PlanLimitGuard
        features={['branches', 'beneficiaries']}
        backHref="/dashboard"
        mode="all"
      >
        <div data-testid="children">Content</div>
      </PlanLimitGuard>
    );
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    expect(screen.getByText('limitReachedTitle')).toBeInTheDocument();
  });

  it('does not block when only some features are at limit (all mode)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 1, is_at_limit: true },
          { feature: 'beneficiaries', limit_value: 100, current_usage: 50, is_at_limit: false },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn((f: string) => f === 'branches'),
    });

    render(
      <PlanLimitGuard
        features={['branches', 'beneficiaries']}
        backHref="/dashboard"
        mode="all"
      >
        <div data-testid="children">Content</div>
      </PlanLimitGuard>
    );
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('shows upgrade button when plan is not pro', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 1, is_at_limit: true },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.getByText('upgradePlanButton')).toBeInTheDocument();
  });

  it('hides upgrade button when plan is pro', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'pro',
        features: [
          { feature: 'branches', limit_value: 15, current_usage: 15, is_at_limit: true },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.queryByText('upgradePlanButton')).not.toBeInTheDocument();
  });

  it('renders children when summary is null (not loading)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: false,
      isAtLimit: jest.fn(() => false),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });

  it('shows usage as 0/0 when feature is not in summary features', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [], // empty features - usage will be undefined
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.queryByTestId('children')).not.toBeInTheDocument();
    // The blocked feature should display 0/0 when usage is undefined
    expect(screen.getByText(/0\/0/)).toBeInTheDocument();
  });

  it('shows back link', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          { feature: 'branches', limit_value: 1, current_usage: 1, is_at_limit: true },
        ],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(<PlanLimitGuard {...defaultProps} />);
    expect(screen.getByText('goBack')).toBeInTheDocument();
  });
});
