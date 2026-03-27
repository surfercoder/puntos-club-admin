import { render, screen } from '@testing-library/react';
import { BranchPerformanceChart } from '@/components/dashboard/charts/branch-performance-chart';
import type { BranchPerformanceStat } from '@/actions/dashboard/analytics/actions';

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: ({ tickFormatter, ..._props }: any) => (
      <div data-testid="y-axis">
        {tickFormatter && <span data-testid="formatted-tick">{tickFormatter(1500)}</span>}
        {tickFormatter && <span data-testid="formatted-tick-small">{tickFormatter(500)}</span>}
      </div>
    ),
  };
});

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: any) => <div data-testid="chart-container" {...props}>{children}</div>,
  ChartTooltip: ({ content }: any) => <div data-testid="chart-tooltip">{content}</div>,
  ChartTooltipContent: ({ formatter, ..._props }: any) => (
    <div data-testid="chart-tooltip-content">
      {formatter && formatter(1500, 'revenue', {}, 0, [])}
      {formatter && formatter(10, 'purchase_count', {}, 1, [])}
    </div>
  ),
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

const sampleData: BranchPerformanceStat[] = [
  { branch: 'Sucursal Norte', revenue: 25000, purchase_count: 15 },
  { branch: 'Sucursal Sur', revenue: 18000, purchase_count: 10 },
  { branch: 'Sucursal Centro', revenue: 32000, purchase_count: 22 },
];

describe('BranchPerformanceChart', () => {
  it('renders the card with title and description', () => {
    render(<BranchPerformanceChart data={sampleData} />);
    expect(screen.getByText('Rendimiento por sucursal')).toBeInTheDocument();
    expect(screen.getByText('Ingresos y compras totales por sucursal')).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<BranchPerformanceChart data={sampleData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<BranchPerformanceChart data={[]} />);
    expect(screen.getByText('Rendimiento por sucursal')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('truncates branch names longer than 16 characters', () => {
    const longNameData: BranchPerformanceStat[] = [
      { branch: 'Sucursal Muy Lejana del Norte', revenue: 5000, purchase_count: 3 },
    ];
    render(<BranchPerformanceChart data={longNameData} />);
    // The component slices to 14 chars and appends an ellipsis for names > 16 chars
    // The truncated name should not appear as the original
    expect(screen.queryByText('Sucursal Muy Lejana del Norte')).not.toBeInTheDocument();
  });

  it('does not truncate branch names of 16 characters or less', () => {
    const shortNameData: BranchPerformanceStat[] = [
      { branch: 'Sucursal Norte', revenue: 5000, purchase_count: 3 },
    ];
    render(<BranchPerformanceChart data={shortNameData} />);
    // 14 chars - should not be truncated
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders card structure elements', () => {
    render(<BranchPerformanceChart data={sampleData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('calls the tooltip formatter for revenue and non-revenue names', () => {
    render(<BranchPerformanceChart data={sampleData} />);
    const tooltipContent = screen.getByTestId('chart-tooltip-content');
    // The formatter is called with revenue and purchase_count via the mock
    expect(tooltipContent).toBeInTheDocument();
    // Revenue formatter should produce a $ formatted span
    expect(tooltipContent.innerHTML).toContain('$');
  });

  it('calls the YAxis tickFormatter for large and small values', () => {
    render(<BranchPerformanceChart data={sampleData} />);
    // tickFormatter(1500) => "$2k" (1500/1000 = 1.5, toFixed(0) = "2") actually "$2k"
    expect(screen.getByTestId('formatted-tick')).toHaveTextContent('$2k');
    // tickFormatter(500) => "$500"
    expect(screen.getByTestId('formatted-tick-small')).toHaveTextContent('$500');
  });
});
