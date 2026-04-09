import { render, screen } from '@testing-library/react';
import { PlanUsageChart } from '@/components/dashboard/charts/plan-usage-chart-view';
import type { OrganizationUsageSummary } from '@/types/plan';

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

const sampleData: OrganizationUsageSummary = {
  plan: 'advance',
  features: [
    { feature: 'beneficiaries', current_usage: 50, limit_value: 100, usage_percentage: 50, is_at_limit: false, should_warn: false },
    { feature: 'branches', current_usage: 3, limit_value: 5, usage_percentage: 60, is_at_limit: false, should_warn: true },
  ],
};

describe('PlanUsageChart', () => {
  it('renders the card with title and description', () => {
    render(<PlanUsageChart data={sampleData} />);
    expect(screen.getByText('Uso del plan')).toBeInTheDocument();
    expect(screen.getByText(/Utilización de los límites de tu plan/)).toBeInTheDocument();
  });

  it('displays the plan name', () => {
    render(<PlanUsageChart data={sampleData} />);
    expect(screen.getByText('advance')).toBeInTheDocument();
  });

  it('renders a chart container for each feature', () => {
    render(<PlanUsageChart data={sampleData} />);
    const containers = screen.getAllByTestId('chart-container');
    expect(containers).toHaveLength(2);
  });

  it('displays translated feature labels', () => {
    render(<PlanUsageChart data={sampleData} />);
    expect(screen.getByText('Socios')).toBeInTheDocument();
    expect(screen.getByText('Sucursales')).toBeInTheDocument();
  });

  it('displays usage fraction for each feature', () => {
    render(<PlanUsageChart data={sampleData} />);
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
  });

  it('renders with empty features array', () => {
    const emptyData: OrganizationUsageSummary = {
      plan: 'basic',
      features: [],
    };
    render(<PlanUsageChart data={emptyData} />);
    expect(screen.getByText('Uso del plan')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-container')).not.toBeInTheDocument();
  });

  it('applies warning style for features that should warn', () => {
    render(<PlanUsageChart data={sampleData} />);
    const sucursales = screen.getByText('Sucursales');
    expect(sucursales.className).toContain('text-amber-500');
  });

  it('applies destructive style for features at limit', () => {
    const atLimitData: OrganizationUsageSummary = {
      plan: 'basic',
      features: [
        { feature: 'beneficiaries', current_usage: 100, limit_value: 100, usage_percentage: 100, is_at_limit: true, should_warn: false },
      ],
    };
    render(<PlanUsageChart data={atLimitData} />);
    const socios = screen.getByText('Socios');
    expect(socios.className).toContain('text-destructive');
  });

  it('applies default muted style for features not at limit or warning', () => {
    render(<PlanUsageChart data={sampleData} />);
    const socios = screen.getByText('Socios');
    expect(socios.className).toContain('text-muted-foreground');
  });

  it('caps usage percentage at 100 and renders feature', () => {
    const overLimitData: OrganizationUsageSummary = {
      plan: 'basic',
      features: [
        { feature: 'beneficiaries', current_usage: 120, limit_value: 100, usage_percentage: 120, is_at_limit: true, should_warn: false },
      ],
    };
    render(<PlanUsageChart data={overLimitData} />);
    // The component uses Math.min(usage_percentage, 100) so chart data is capped
    // Verify the feature still renders with its usage fraction
    expect(screen.getByText('120 / 100')).toBeInTheDocument();
  });

  it('falls back to raw feature key when not in FEATURE_LABELS map', () => {
    const unknownFeatureData: OrganizationUsageSummary = {
      plan: 'basic',
      features: [
        { feature: 'unknown_feature', current_usage: 10, limit_value: 50, usage_percentage: 20, is_at_limit: false, should_warn: false },
      ],
    };
    render(<PlanUsageChart data={unknownFeatureData} />);
    // The fallback `FEATURE_LABELS[f.feature] ?? f.feature` should use the raw key
    expect(screen.getByText('unknown_feature')).toBeInTheDocument();
  });
});
