import { render, screen } from '@testing-library/react';
import { PurchasesOverTimeChart } from '@/components/dashboard/charts/purchases-over-time-chart';
import type { MonthlyPurchaseStat } from '@/actions/dashboard/analytics/actions';

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Area: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: ({ tickFormatter, ..._props }: any) => (
      <div data-testid="y-axis">
        {tickFormatter && <span>{tickFormatter(1500)}</span>}
      </div>
    ),
  };
});

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: any) => <div data-testid="chart-container" {...props}>{children}</div>,
  ChartTooltip: ({ content }: any) => <div data-testid="chart-tooltip">{content}</div>,
  ChartTooltipContent: ({ formatter, ..._props }: any) => (
    <div data-testid="chart-tooltip-content">
      {formatter && formatter(22000, 'revenue', {}, 0, [])}
      {formatter && formatter(18, 'purchase_count', {}, 1, [])}
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

const sampleData: MonthlyPurchaseStat[] = [
  { month: '2025-10', revenue: 15000, points_earned: 300, purchase_count: 12 },
  { month: '2025-11', revenue: 22000, points_earned: 440, purchase_count: 18 },
  { month: '2025-12', revenue: 30000, points_earned: 600, purchase_count: 25 },
];

describe('PurchasesOverTimeChart', () => {
  it('renders the card with title and description', () => {
    render(<PurchasesOverTimeChart data={sampleData} />);
    expect(screen.getByText('Ventas en el tiempo')).toBeInTheDocument();
    expect(screen.getByText(/Ingresos y cantidad de compras/)).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<PurchasesOverTimeChart data={sampleData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<PurchasesOverTimeChart data={[]} />);
    expect(screen.getByText('Ventas en el tiempo')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders card structure elements', () => {
    render(<PurchasesOverTimeChart data={sampleData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
  });

  it('renders with a single data point', () => {
    const singlePoint: MonthlyPurchaseStat[] = [
      { month: '2025-12', revenue: 5000, points_earned: 100, purchase_count: 4 },
    ];
    render(<PurchasesOverTimeChart data={singlePoint} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders YAxis tick formatter output', () => {
    render(<PurchasesOverTimeChart data={sampleData} />);
    const yAxes = screen.getAllByTestId('y-axis');
    // At least one YAxis should render the tick formatter output
    const hasFormattedTick = yAxes.some((el) => el.textContent?.includes('$2k'));
    expect(hasFormattedTick).toBe(true);
  });

  it('calls the tooltip formatter for revenue and non-revenue names', () => {
    render(<PurchasesOverTimeChart data={sampleData} />);
    const tooltipContent = screen.getByTestId('chart-tooltip-content');
    expect(tooltipContent).toBeInTheDocument();
    // Revenue formatter produces a $ formatted span
    expect(tooltipContent.innerHTML).toContain('$');
  });
});
