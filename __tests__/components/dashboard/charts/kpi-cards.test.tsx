import { render, screen } from '@testing-library/react';
import { KpiCards, KpiCard } from '@/components/dashboard/charts/kpi-cards';
import type { DashboardKpis } from '@/actions/dashboard/analytics/actions';

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: any) => <div data-testid="chart-container" {...props}>{children}</div>,
  ChartTooltip: (_props: any) => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: (_props: any) => <div data-testid="chart-tooltip-content" />,
  ChartLegend: (_props: any) => <div data-testid="chart-legend" />,
  ChartLegendContent: (_props: any) => <div data-testid="chart-legend-content" />,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
}));

jest.mock('lucide-react', () => ({
  Users: ({ className }: any) => <span data-testid="icon-users" className={className} />,
  ShoppingCart: ({ className }: any) => <span data-testid="icon-cart" className={className} />,
  Star: ({ className }: any) => <span data-testid="icon-star" className={className} />,
  TrendingUp: ({ className }: any) => <span data-testid="icon-trending" className={className} />,
  Gift: ({ className }: any) => <span data-testid="icon-gift" className={className} />,
  Coins: ({ className }: any) => <span data-testid="icon-coins" className={className} />,
}));

const sampleData: DashboardKpis = {
  total_active_members: 150,
  revenue_this_month: 50000,
  purchases_this_month: 30,
  points_in_circulation: 10000,
  redemptions_this_month: 5,
  points_redeemed_this_month: 500,
};

describe('KpiCards', () => {
  it('renders all 6 KPI cards', () => {
    const { container } = render(<KpiCards data={sampleData} />);
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(6);
  });

  it('displays the correct KPI titles', () => {
    render(<KpiCards data={sampleData} />);
    expect(screen.getByText('activeMembers')).toBeInTheDocument();
    expect(screen.getByText('monthlyRevenue')).toBeInTheDocument();
    expect(screen.getByText('monthlyPurchases')).toBeInTheDocument();
    expect(screen.getByText('pointsInCirculation')).toBeInTheDocument();
    expect(screen.getByText('monthlyRedemptions')).toBeInTheDocument();
    expect(screen.getByText('pointsRedeemed')).toBeInTheDocument();
  });

  it('displays formatted numeric values', () => {
    render(<KpiCards data={sampleData} />);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('displays subtitle text', () => {
    render(<KpiCards data={sampleData} />);
    expect(screen.getByText('activeMembersSubtitle')).toBeInTheDocument();
    expect(screen.getByText('monthlyRevenueSubtitle')).toBeInTheDocument();
    expect(screen.getByText('monthlyPurchasesSubtitle')).toBeInTheDocument();
    expect(screen.getByText('pointsInCirculationSubtitle')).toBeInTheDocument();
    expect(screen.getByText('monthlyRedemptionsSubtitle')).toBeInTheDocument();
    expect(screen.getByText('pointsRedeemedSubtitle')).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    const zeroData: DashboardKpis = {
      total_active_members: 0,
      revenue_this_month: 0,
      purchases_this_month: 0,
      points_in_circulation: 0,
      redemptions_this_month: 0,
      points_redeemed_this_month: 0,
    };
    const { container } = render(<KpiCards data={zeroData} />);
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(6);
  });

  it('renders icons for each KPI card', () => {
    render(<KpiCards data={sampleData} />);
    expect(screen.getByTestId('icon-users')).toBeInTheDocument();
    expect(screen.getByTestId('icon-trending')).toBeInTheDocument();
    expect(screen.getByTestId('icon-cart')).toBeInTheDocument();
    expect(screen.getByTestId('icon-coins')).toBeInTheDocument();
    expect(screen.getByTestId('icon-gift')).toBeInTheDocument();
    expect(screen.getByTestId('icon-star')).toBeInTheDocument();
  });

  it('applies the tint classes to the icon box', () => {
    const TestIcon = ({ className }: { className?: string }) => (
      <span data-testid="test-icon" className={className} />
    );
    const { container } = render(
      <KpiCard
        title="Test KPI"
        value="42"
        subtitle="Test subtitle"
        icon={TestIcon}
        tint="bg-brand-blue/10 text-brand-blue"
      />
    );
    expect(container.querySelector('.bg-brand-blue\\/10')).not.toBeNull();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
