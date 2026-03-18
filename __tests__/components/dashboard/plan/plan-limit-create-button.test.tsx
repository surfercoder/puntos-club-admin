import { render, screen } from '@testing-library/react';
import { PlanLimitCreateButton } from '@/components/dashboard/plan/plan-limit-create-button';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

describe('PlanLimitCreateButton', () => {
  const defaultProps = {
    features: ['branches' as const],
    createHref: '/dashboard/branch/new',
    createLabel: 'Create Branch',
  };

  it('renders as enabled link when not at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [{ feature: 'branches', is_at_limit: false }],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => false),
    });

    render(<PlanLimitCreateButton {...defaultProps} />);
    const link = screen.getByRole('link', { name: 'Create Branch' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/dashboard/branch/new');
  });

  it('renders as disabled button when at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [{ feature: 'branches', is_at_limit: true }],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(<PlanLimitCreateButton {...defaultProps} />);
    const button = screen.getByRole('button', { name: 'Create Branch' });
    expect(button).toBeDisabled();
  });

  it('renders as enabled link while loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: null,
      isLoading: true,
      isAtLimit: jest.fn(() => false),
    });

    render(<PlanLimitCreateButton {...defaultProps} />);
    expect(screen.getByRole('link', { name: 'Create Branch' })).toBeInTheDocument();
  });

  it('disables when any feature is at limit (default any mode)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [],
      },
      isLoading: false,
      isAtLimit: jest.fn((f: string) => f === 'branches'),
    });

    render(
      <PlanLimitCreateButton
        features={['branches', 'beneficiaries']}
        createHref="/dashboard/branch/new"
        createLabel="Create"
      />
    );
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).toBeDisabled();
  });

  it('only disables when all features are at limit (all mode)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [],
      },
      isLoading: false,
      isAtLimit: jest.fn((f: string) => f === 'branches'),
    });

    render(
      <PlanLimitCreateButton
        features={['branches', 'beneficiaries']}
        createHref="/dashboard/branch/new"
        createLabel="Create"
        disableMode="all"
      />
    );
    // Not all at limit, so should be a link (not disabled)
    expect(screen.getByRole('link', { name: 'Create' })).toBeInTheDocument();
  });

  it('disables when all features are at limit (all mode, all at limit)', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      summary: {
        plan: 'trial',
        features: [],
      },
      isLoading: false,
      isAtLimit: jest.fn(() => true),
    });

    render(
      <PlanLimitCreateButton
        features={['branches', 'beneficiaries']}
        createHref="/dashboard/branch/new"
        createLabel="Create"
        disableMode="all"
      />
    );
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).toBeDisabled();
  });
});
