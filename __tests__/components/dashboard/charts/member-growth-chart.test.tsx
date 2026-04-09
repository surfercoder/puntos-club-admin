import { render, screen } from '@testing-library/react';
import { MemberGrowthChart } from '@/components/dashboard/charts/member-growth-chart-view';
import type { MonthlyMemberStat } from '@/actions/dashboard/analytics/actions';

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

const sampleData: MonthlyMemberStat[] = [
  { month: '2025-10', new_members: 10, total_members: 100 },
  { month: '2025-11', new_members: 15, total_members: 115 },
  { month: '2025-12', new_members: 20, total_members: 135 },
];

describe('MemberGrowthChart', () => {
  it('renders the card with title and description', () => {
    render(<MemberGrowthChart data={sampleData} />);
    expect(screen.getByText('Crecimiento de socios')).toBeInTheDocument();
    expect(screen.getByText(/Altas mensuales y total acumulado/)).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<MemberGrowthChart data={sampleData} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<MemberGrowthChart data={[]} />);
    expect(screen.getByText('Crecimiento de socios')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('renders card structure elements', () => {
    render(<MemberGrowthChart data={sampleData} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
  });

  it('renders with a single data point', () => {
    const singlePoint: MonthlyMemberStat[] = [
      { month: '2025-12', new_members: 5, total_members: 50 },
    ];
    render(<MemberGrowthChart data={singlePoint} />);
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });
});
