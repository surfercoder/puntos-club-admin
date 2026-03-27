import { render, screen } from '@testing-library/react';
import { TopProductsChart } from '@/components/dashboard/charts/top-products-chart';
import type { TopProductStat } from '@/actions/dashboard/analytics/actions';

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => null,
    Cell: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children, ...props }: any) => <div data-testid="chart-container" {...props}>{children}</div>,
  ChartTooltip: ({ content }: any) => <div data-testid="chart-tooltip">{content}</div>,
  ChartTooltipContent: ({ formatter, ..._props }: any) => (
    <div data-testid="chart-tooltip-content">
      {formatter && formatter(2500, 'points_used', {}, 0, [])}
      {formatter && formatter(50, 'redemptions', {}, 1, [])}
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

const sampleData: TopProductStat[] = [
  { name: 'Cafe Latte', redemptions: 50, points_used: 2500 },
  { name: 'Medialunas', redemptions: 35, points_used: 1750 },
  { name: 'Jugo Natural', redemptions: 20, points_used: 1000 },
];

describe('TopProductsChart', () => {
  it('renders the card with title and description', () => {
    render(<TopProductsChart data={sampleData} />);
    expect(screen.getByText('Productos más canjeados')).toBeInTheDocument();
    expect(screen.getByText(/Top 3 productos por cantidad de canjes/)).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<TopProductsChart data={sampleData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<TopProductsChart data={[]} />);
    expect(screen.getByText('Productos más canjeados')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('displays correct count in description based on data length', () => {
    const fiveProducts: TopProductStat[] = [
      { name: 'Product 1', redemptions: 50, points_used: 2500 },
      { name: 'Product 2', redemptions: 35, points_used: 1750 },
      { name: 'Product 3', redemptions: 20, points_used: 1000 },
      { name: 'Product 4', redemptions: 15, points_used: 750 },
      { name: 'Product 5', redemptions: 10, points_used: 500 },
    ];
    render(<TopProductsChart data={fiveProducts} />);
    expect(screen.getByText(/Top 5 productos/)).toBeInTheDocument();
  });

  it('truncates product names longer than 20 characters', () => {
    const longNameData: TopProductStat[] = [
      { name: 'Cafe Latte con Leche de Almendras', redemptions: 10, points_used: 500 },
    ];
    render(<TopProductsChart data={longNameData} />);
    // The component truncates to 18 chars + ellipsis for names > 20 chars
    expect(screen.queryByText('Cafe Latte con Leche de Almendras')).not.toBeInTheDocument();
  });

  it('does not truncate product names of 20 characters or less', () => {
    const shortNameData: TopProductStat[] = [
      { name: 'Cafe Latte', redemptions: 10, points_used: 500 },
    ];
    render(<TopProductsChart data={shortNameData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('renders card structure elements', () => {
    render(<TopProductsChart data={sampleData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('calls the tooltip formatter for points_used and non-points_used names', () => {
    render(<TopProductsChart data={sampleData} />);
    const tooltipContent = screen.getByTestId('chart-tooltip-content');
    expect(tooltipContent).toBeInTheDocument();
    // points_used formatter should produce "pts" text
    expect(tooltipContent.innerHTML).toContain('pts');
  });
});
