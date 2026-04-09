"use client";

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BranchPerformanceStat } from "@/actions/dashboard/analytics/actions";

const chartConfig = {
  revenue: {
    label: "Ingresos ($)",
    color: "var(--chart-3)",
  },
  purchase_count: {
    label: "Compras",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data: BranchPerformanceStat[];
};

export function BranchPerformanceChart({ data }: Props) {
  const chartData = data.map((b) => ({
    ...b,
    branch: b.branch.length > 16 ? `${b.branch.slice(0, 14)}…` : b.branch,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento por sucursal</CardTitle>
        <CardDescription>
          Ingresos y compras totales por sucursal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12, top: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="branch"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
              }
              width={52}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return (
                        <span className="font-mono font-medium tabular-nums">
                          ${Number(value).toLocaleString("es-AR")}
                        </span>
                      );
                    }
                    return <span className="font-mono font-medium tabular-nums">{value}</span>;
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="revenue"
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="count"
              dataKey="purchase_count"
              fill="var(--color-purchase_count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
