"use client";

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
import type { MonthlyPointsStat } from "@/actions/dashboard/analytics/actions";

const chartConfig = {
  points_earned: {
    label: "Puntos otorgados",
    color: "var(--chart-1)",
  },
  points_redeemed: {
    label: "Puntos canjeados",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

type Props = {
  data: MonthlyPointsStat[];
};

export function PointsEconomyChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Economía de puntos</CardTitle>
        <CardDescription>
          Puntos otorgados vs canjeados en los últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              width={48}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="points_earned"
              fill="var(--color-points_earned)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="points_redeemed"
              fill="var(--color-points_redeemed)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
