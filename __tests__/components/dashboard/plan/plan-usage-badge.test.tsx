import { render, screen } from '@testing-library/react';
import { PlanUsageBadge } from '@/components/dashboard/plan/plan-usage-badge';
import { usePlanUsage } from '@/components/providers/plan-usage-provider';

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span data-testid="badge" className={className} {...props}>
      {children}
    </span>
  ),
}));

jest.mock('@/lib/plans/config', () => ({
  PLAN_FEATURE_LABELS: {
    beneficiaries: 'Beneficiarios',
    branches: 'Sucursales',
    push_notifications_monthly: 'Notificaciones / mes',
    cashiers: 'Cajeros',
    collaborators: 'Usuarios colaboradores',
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('PlanUsageBadge', () => {
  it('renders nothing when loading', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(),
      isLoading: true,
    });

    const { container } = render(<PlanUsageBadge feature="beneficiaries" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when feature is not found', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => null),
      isLoading: false,
    });

    const { container } = render(<PlanUsageBadge feature="beneficiaries" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders usage count when feature exists', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 5,
        limit_value: 100,
        is_at_limit: false,
        should_warn: false,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('5');
    expect(screen.getByTestId('badge')).toHaveTextContent('100');
  });

  it('shows feature label when showLabel is true', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 5,
        limit_value: 100,
        is_at_limit: false,
        should_warn: false,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" showLabel />);
    expect(screen.getByTestId('badge')).toHaveTextContent('Beneficiarios:');
  });

  it('does not show feature label when showLabel is false', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 5,
        limit_value: 100,
        is_at_limit: false,
        should_warn: false,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" />);
    expect(screen.getByTestId('badge')).not.toHaveTextContent('Beneficiarios:');
  });

  it('applies red classes when at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 100,
        limit_value: 100,
        is_at_limit: true,
        should_warn: true,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" />);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('red');
  });

  it('applies amber classes when should warn but not at limit', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 85,
        limit_value: 100,
        is_at_limit: false,
        should_warn: true,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" />);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('amber');
  });

  it('applies green classes when usage is normal', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 5,
        limit_value: 100,
        is_at_limit: false,
        should_warn: false,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" />);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('green');
  });

  it('applies custom className', () => {
    (usePlanUsage as jest.Mock).mockReturnValue({
      getFeature: jest.fn(() => ({
        current_usage: 5,
        limit_value: 100,
        is_at_limit: false,
        should_warn: false,
      })),
      isLoading: false,
    });

    render(<PlanUsageBadge feature="beneficiaries" className="my-custom-class" />);
    const badge = screen.getByTestId('badge');
    expect(badge.className).toContain('my-custom-class');
  });
});
