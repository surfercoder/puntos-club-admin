import { render, screen } from '@testing-library/react';
import { PlanUsageSummary } from '@/components/dashboard/plan/plan-usage-summary';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

describe('PlanUsageSummary', () => {
  it('shows loading spinner when isLoading is true', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: true,
    });

    const { container } = render(<PlanUsageSummary />);
    // Loader2 renders an svg with animate-spin class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders nothing when no summary and not loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: false,
    });

    const { container } = render(<PlanUsageSummary />);
    expect(container.firstChild).toBeNull();
  });

  it('shows feature usage bars', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 50,
            usage_percentage: 50,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
          {
            feature: 'branches',
            limit_value: 1,
            current_usage: 0,
            usage_percentage: 0,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    // Feature labels come from PLAN_FEATURE_LABELS
    expect(screen.getByText('Beneficiarios')).toBeInTheDocument();
    expect(screen.getByText('Sucursales')).toBeInTheDocument();
    // Usage numbers
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
    // Progress bars
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(2);
  });

  it('shows plan name and usage title', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'advance',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 500,
            current_usage: 100,
            usage_percentage: 20,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    expect(screen.getByText('usageTitle')).toBeInTheDocument();
    expect(screen.getByText('Plan Advance')).toBeInTheDocument();
  });

  it('shows compact mode without card wrapper', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 50,
            usage_percentage: 50,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary compact />);
    expect(screen.getByText('Beneficiarios')).toBeInTheDocument();
    // Compact mode should not show usageTitle header
    expect(screen.queryByText('usageTitle')).not.toBeInTheDocument();
  });

  it('shows upgrade button when plan is not pro', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 50,
            usage_percentage: 50,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    expect(screen.getByText('upgradePlanButton')).toBeInTheDocument();
  });

  it('hides upgrade button when plan is pro', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'pro',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 5000,
            current_usage: 50,
            usage_percentage: 1,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    expect(screen.queryByText('upgradePlanButton')).not.toBeInTheDocument();
  });

  it('shows correct color for feature at limit (red)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 100,
            usage_percentage: 100,
            is_at_limit: true,
            should_warn: true,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.className).toContain('bg-red-500');
  });

  it('shows correct color for feature at 80% (amber)', () => {
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
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.className).toContain('bg-amber-500');
  });

  it('shows correct color for feature at 60% (blue)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 60,
            usage_percentage: 60,
            is_at_limit: false,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar.className).toContain('bg-blue-500');
  });

  it('shows is_at_limit warning banner', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [
          {
            feature: 'beneficiaries',
            limit_value: 100,
            current_usage: 100,
            usage_percentage: 100,
            is_at_limit: true,
            should_warn: false,
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    expect(screen.getByText('nearingLimitWarning')).toBeInTheDocument();
  });

  it('shows warning banner when features have warnings', () => {
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
            warning_threshold: 0.8,
          },
        ],
      },
      isLoading: false,
    });

    render(<PlanUsageSummary />);
    expect(screen.getByText('nearingLimitWarning')).toBeInTheDocument();
  });
});
