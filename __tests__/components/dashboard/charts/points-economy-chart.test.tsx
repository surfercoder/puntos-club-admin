import { render, screen } from '@testing-library/react';
import { PointsEconomyChart } from '@/components/dashboard/charts/points-economy-chart-view';
import type { MonthlyPointsStat } from '@/actions/dashboard/analytics/actions';

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

const sampleData: MonthlyPointsStat[] = [
  { month: '2025-10', points_earned: 500, points_redeemed: 200 },
  { month: '2025-11', points_earned: 700, points_redeemed: 350 },
  { month: '2025-12', points_earned: 900, points_redeemed: 400 },
];

describe('PointsEconomyChart', () => {
  it('renders the card with title and description', () => {
    render(<PointsEconomyChart data={sampleData} />);
    expect(screen.getByText('Economía de puntos')).toBeInTheDocument();
    expect(screen.getByText(/Puntos otorgados vs canjeados/)).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<PointsEconomyChart data={sampleData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<PointsEconomyChart data={[]} />);
    expect(screen.getByText('Economía de puntos')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders card structure elements', () => {
    render(<PointsEconomyChart data={sampleData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
  });

  it('renders with a single data point', () => {
    const singlePoint: MonthlyPointsStat[] = [
      { month: '2025-12', points_earned: 100, points_redeemed: 50 },
    ];
    render(<PointsEconomyChart data={singlePoint} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('calls the YAxis tickFormatter for large and small values', () => {
    render(<PointsEconomyChart data={sampleData} />);
    // tickFormatter(1500) => "2k" (1500/1000 = 1.5, toFixed(0) = "2")
    expect(screen.getByTestId('formatted-tick')).toHaveTextContent('2k');
    // tickFormatter(500) => "500"
    expect(screen.getByTestId('formatted-tick-small')).toHaveTextContent('500');
  });
});
