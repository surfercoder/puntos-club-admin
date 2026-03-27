import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  // ChartStyle is tested via ChartContainer rendering
} from '@/components/ui/chart';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: ({ content, ..._props }: any) => (
    <div data-testid="recharts-tooltip">{content}</div>
  ),
  Legend: ({ content, ..._props }: any) => (
    <div data-testid="recharts-legend">{content}</div>
  ),
}));

const testConfig = {
  revenue: { label: 'Revenue', color: '#ff0000' },
  sales: { label: 'Sales', theme: { light: '#00ff00', dark: '#0000ff' } as Record<string, string> },
};

const noColorConfig = {
  revenue: { label: 'Revenue' },
};

describe('ChartContainer', () => {
  it('renders children within context provider', () => {
    render(
      <ChartContainer config={testConfig}>
        <div data-testid="child">Hello</div>
      </ChartContainer>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('generates a data-chart id', () => {
    const { container } = render(
      <ChartContainer config={testConfig}>
        <div>Content</div>
      </ChartContainer>
    );
    const chartDiv = container.querySelector('[data-chart]');
    expect(chartDiv).toBeInTheDocument();
    expect(chartDiv?.getAttribute('data-chart')).toMatch(/^chart-/);
  });
});

describe('ChartStyle', () => {
  it('renders style element with theme CSS variables', () => {
    const { container } = render(
      <ChartContainer config={testConfig}>
        <div>Content</div>
      </ChartContainer>
    );
    const styleEl = container.querySelector('style');
    expect(styleEl).toBeInTheDocument();
    expect(styleEl?.innerHTML).toContain('--color-revenue');
    expect(styleEl?.innerHTML).toContain('#ff0000');
    expect(styleEl?.innerHTML).toContain('--color-sales');
  });

  it('returns null when no color config', () => {
    const { container } = render(
      <ChartContainer config={noColorConfig}>
        <div>Content</div>
      </ChartContainer>
    );
    const styleEl = container.querySelector('style');
    expect(styleEl).not.toBeInTheDocument();
  });
});

describe('ChartTooltipContent', () => {
  it('renders nothing when not active', () => {
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>
    );
    // Only the chart container structure, no tooltip div
    expect(container.querySelector('.min-w-\\[8rem\\]')).not.toBeInTheDocument();
  });

  it('renders tooltip items when active with payload', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 1000,
        color: '#ff0000',
        payload: { revenue: 1000 },
      },
    ];
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="Jan" />
      </ChartContainer>
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders with formatter', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 500,
        color: '#ff0000',
        payload: { revenue: 500 },
      },
    ];
    const formatter = jest.fn(
      (value: any, name: any) => <span data-testid="formatted">{`${name}: $${value}`}</span>
    );
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent
          active={true}
          payload={payload}
          label="Feb"
          formatter={formatter}
        />
      </ChartContainer>
    );
    expect(formatter).toHaveBeenCalled();
    expect(screen.getByTestId('formatted')).toBeInTheDocument();
  });

  it('renders with labelFormatter', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 200,
        color: '#ff0000',
        payload: { revenue: 200 },
      },
    ];
    const labelFormatter = jest.fn(
      (value: any) => <span data-testid="label-formatted">Formatted: {String(value)}</span>
    );
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent
          active={true}
          payload={payload}
          label="Mar"
          labelFormatter={labelFormatter}
        />
      </ChartContainer>
    );
    expect(labelFormatter).toHaveBeenCalled();
    expect(screen.getByTestId('label-formatted')).toBeInTheDocument();
  });

  it('handles hideLabel and hideIndicator', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 300,
        color: '#ff0000',
        payload: { revenue: 300 },
      },
    ];
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent
          active={true}
          payload={payload}
          label="Apr"
          hideLabel={true}
          hideIndicator={true}
        />
      </ChartContainer>
    );
    // Label should be hidden
    expect(screen.queryByText('Apr')).not.toBeInTheDocument();
    // Indicator div should not be present (no bg-(--color-bg) div)
    const indicatorDivs = container.querySelectorAll('[style*="--color-bg"]');
    expect(indicatorDivs.length).toBe(0);
  });

  it('handles indicator type dot', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 100,
        color: '#ff0000',
        payload: { revenue: 100 },
      },
    ];
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="May" indicator="dot" />
      </ChartContainer>
    );
    const indicator = container.querySelector('[style*="--color-bg"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator?.className).toContain('h-2.5');
    expect(indicator?.className).toContain('w-2.5');
  });

  it('handles indicator type line', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 100,
        color: '#ff0000',
        payload: { revenue: 100 },
      },
      {
        dataKey: 'sales',
        name: 'sales',
        value: 200,
        color: '#00ff00',
        payload: { sales: 200 },
      },
    ];
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="Jun" indicator="line" />
      </ChartContainer>
    );
    const indicators = container.querySelectorAll('[style*="--color-bg"]');
    expect(indicators.length).toBeGreaterThan(0);
    indicators.forEach((el) => {
      expect(el.className).toContain('w-1');
    });
  });

  it('handles indicator type dashed', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 100,
        color: '#ff0000',
        payload: { revenue: 100 },
      },
      {
        dataKey: 'sales',
        name: 'sales',
        value: 200,
        color: '#00ff00',
        payload: { sales: 200 },
      },
    ];
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="Jul" indicator="dashed" />
      </ChartContainer>
    );
    const indicators = container.querySelectorAll('[style*="--color-bg"]');
    expect(indicators.length).toBeGreaterThan(0);
    indicators.forEach((el) => {
      expect(el.className).toContain('border-dashed');
    });
  });

  it('handles nestLabel scenario (1 payload item + non-dot indicator)', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 400,
        color: '#ff0000',
        payload: { revenue: 400 },
      },
    ];
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="Aug" indicator="line" />
      </ChartContainer>
    );
    // With nestLabel, the label is nested inside the item row, not at the top
    // The label "Revenue" (from config for the label key) or "Aug" should appear
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('renders icon from config when available', () => {
    const IconComponent = () => <svg data-testid="custom-icon" />;
    const configWithIcon = {
      revenue: { label: 'Revenue', color: '#ff0000', icon: IconComponent },
    };
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 600,
        color: '#ff0000',
        payload: { revenue: 600 },
      },
    ];
    render(
      <ChartContainer config={configWithIcon}>
        <ChartTooltipContent active={true} payload={payload} label="Sep" />
      </ChartContainer>
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('resolves tooltip label from config when label matches a config key', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 800,
        color: '#ff0000',
        payload: { revenue: 800 },
      },
    ];
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="revenue" />
      </ChartContainer>
    );
    // label="revenue" matches config key, so it should resolve to config label "Revenue"
    // "Revenue" appears both in the tooltip label and in the item label
    const revenueElements = screen.getAllByText('Revenue');
    expect(revenueElements.length).toBeGreaterThanOrEqual(2);
  });

  it('resolves tooltip label via labelKey path (itemConfig.label)', () => {
    const payload = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 900,
        color: '#ff0000',
        payload: { revenue: 900 },
      },
    ];
    render(
      <ChartContainer config={testConfig}>
        <ChartTooltipContent active={true} payload={payload} label="Jan" labelKey="revenue" />
      </ChartContainer>
    );
    // labelKey is truthy, so value = itemConfig?.label where itemConfig comes from config["revenue"]
    // config["revenue"].label = "Revenue"
    expect(screen.getAllByText('Revenue').length).toBeGreaterThanOrEqual(1);
  });

  it('resolves config via nested payload key mapping', () => {
    // When the key is not directly in config but payloadPayload[key] is a string that IS in config
    const configWithCategory = {
      electronics: { label: 'Electronics', color: '#123456' },
    };
    const payload = [
      {
        dataKey: 'category',
        name: 'category',
        value: 42,
        color: '#123456',
        payload: { category: 'electronics' },
      },
    ];
    render(
      <ChartContainer config={configWithCategory}>
        <ChartTooltipContent active={true} payload={payload} label="Oct" />
      </ChartContainer>
    );
    // The nameKey defaults to item.name = "category", which is not in config.
    // But payloadPayload["category"] = "electronics", which IS in config.
    // So it resolves to config["electronics"].label = "Electronics"
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });
});

describe('ChartLegendContent', () => {
  it('renders nothing when no payload', () => {
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>
    );
    // Should only contain the chart container structure, not a legend div
    expect(container.querySelector('.flex.items-center.justify-center.gap-4')).not.toBeInTheDocument();
  });

  it('renders legend items with colors', () => {
    const legendPayload = [
      { value: 'revenue', dataKey: 'revenue', color: '#ff0000' },
      { value: 'sales', dataKey: 'sales', color: '#00ff00' },
    ] as any;
    render(
      <ChartContainer config={testConfig}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });

  it('handles verticalAlign top', () => {
    const legendPayload = [
      { value: 'revenue', dataKey: 'revenue', color: '#ff0000' },
    ] as any;
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartLegendContent payload={legendPayload} verticalAlign="top" />
      </ChartContainer>
    );
    const legendDiv = container.querySelector('.flex.items-center.justify-center.gap-4');
    expect(legendDiv?.className).toContain('pb-3');
  });

  it('handles verticalAlign bottom', () => {
    const legendPayload = [
      { value: 'revenue', dataKey: 'revenue', color: '#ff0000' },
    ] as any;
    const { container } = render(
      <ChartContainer config={testConfig}>
        <ChartLegendContent payload={legendPayload} verticalAlign="bottom" />
      </ChartContainer>
    );
    const legendDiv = container.querySelector('.flex.items-center.justify-center.gap-4');
    expect(legendDiv?.className).toContain('pt-3');
  });

  it('handles hideIcon', () => {
    const IconComponent = () => <svg data-testid="legend-icon" />;
    const configWithIcon = {
      revenue: { label: 'Revenue', color: '#ff0000', icon: IconComponent },
    };
    const legendPayload = [
      { value: 'revenue', dataKey: 'revenue', color: '#ff0000' },
    ] as any;
    render(
      <ChartContainer config={configWithIcon}>
        <ChartLegendContent payload={legendPayload} hideIcon={true} />
      </ChartContainer>
    );
    // Icon should not render when hideIcon is true; color dot renders instead
    expect(screen.queryByTestId('legend-icon')).not.toBeInTheDocument();
  });

  it('renders icon from config when available', () => {
    const IconComponent = () => <svg data-testid="legend-icon" />;
    const configWithIcon = {
      revenue: { label: 'Revenue', color: '#ff0000', icon: IconComponent },
    };
    const legendPayload = [
      { value: 'revenue', dataKey: 'revenue', color: '#ff0000' },
    ] as any;
    render(
      <ChartContainer config={configWithIcon}>
        <ChartLegendContent payload={legendPayload} />
      </ChartContainer>
    );
    expect(screen.getByTestId('legend-icon')).toBeInTheDocument();
  });
});

describe('useChart', () => {
  it('throws when used outside ChartContainer', () => {
    // Suppress console.error for expected error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // ChartTooltipContent calls useChart internally
    expect(() => {
      render(<ChartTooltipContent active={true} payload={[]} />);
    }).toThrow('useChart must be used within a <ChartContainer />');

    consoleSpy.mockRestore();
  });
});
