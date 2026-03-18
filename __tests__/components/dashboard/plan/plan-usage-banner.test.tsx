import { render, screen, fireEvent } from '@testing-library/react';
import { PlanUsageBanner } from '@/components/dashboard/plan/plan-usage-banner';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

describe('PlanUsageBanner', () => {
  it('renders nothing when loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: true,
    });

    const { container } = render(<PlanUsageBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no summary', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: false,
    });

    const { container } = render(<PlanUsageBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no warnings', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'branches',
            limit_value: 1,
            current_usage: 0,
            usage_percentage: 0,
            is_at_limit: false,
            should_warn: false,
          },
        ],
      },
      isLoading: false,
    });

    const { container } = render(<PlanUsageBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner when features have warnings', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 85,
            usage_percentage: 85,
            is_at_limit: false,
            should_warn: true,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('nearingLimitBanner')).toBeInTheDocument();
  });

  it('shows at-limit styling when features are at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'branches',
            limit_value: 1,
            current_usage: 1,
            usage_percentage: 100,
            is_at_limit: true,
            should_warn: true,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('limitReachedBanner')).toBeInTheDocument();
  });

  it('can be dismissed', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 85,
            usage_percentage: 85,
            is_at_limit: false,
            should_warn: true,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('closeBanner'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('only shows warnings for specified features', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 85,
            usage_percentage: 85,
            is_at_limit: false,
            should_warn: true,
          },
          {
            feature: 'branches',
            limit_value: 1,
            current_usage: 1,
            usage_percentage: 100,
            is_at_limit: true,
            should_warn: true,
          },
        ],
      },
      isLoading: false,
    });

    // Only filter for branches
    render(<PlanUsageBanner features={['branches']} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('limitReachedBanner')).toBeInTheDocument();
  });

  it('shows upgrade link when plan is not pro', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 85,
            usage_percentage: 85,
            is_at_limit: false,
            should_warn: true,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageBanner />);
    expect(screen.getByText('upgradePlan')).toBeInTheDocument();
  });
});
