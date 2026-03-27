"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TopProductStat } from "@/actions/dashboard/analytics/actions";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type Props = {
  data: TopProductStat[];
};

export function TopProductsChart({ data }: Props) {
  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((p, i) => [
      p.name,
      { label: p.name, color: COLORS[i % COLORS.length] },
    ])
  );

  const chartData = data.map((p) => ({
    name: p.name.length > 20 ? `${p.name.slice(0, 18)}…` : p.name,
    redemptions: p.redemptions,
    points_used: p.points_used,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos más canjeados</CardTitle>
        <CardDescription>
          Top {data.length} productos por cantidad de canjes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            accessibilityLayer
            layout="vertical"
            data={chartData}
            margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={120}
              tick={{ fontSize: 11 }}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (name === "points_used") {
                      return (
                        <span className="font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString("es-AR")} pts
                        </span>
                      );
                    }
                    return <span className="font-mono font-medium tabular-nums">{value}</span>;
                  }}
                />
              }
            />
            <Bar dataKey="redemptions" radius={[0, 4, 4, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
