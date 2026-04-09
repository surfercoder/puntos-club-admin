"use client";

// react-doctor-disable-next-line react-doctor/prefer-dynamic-import
import {
  Area,
  AreaChart,
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
import type { MonthlyMemberStat } from "@/actions/dashboard/analytics/actions";

const chartConfig = {
  total_members: {
    label: "Total socios",
    color: "var(--chart-2)",
  },
  new_members: {
    label: "Nuevos socios",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type Props = {
  data: MonthlyMemberStat[];
};

export function MemberGrowthChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crecimiento de socios</CardTitle>
        <CardDescription>
          Altas mensuales y total acumulado en los últimos 12 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 10 }}
          >
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-total_members)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-total_members)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-new_members)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-new_members)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="total"
              orientation="left"
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="new"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              yAxisId="total"
              type="monotone"
              dataKey="total_members"
              stroke="var(--color-total_members)"
              fill="url(#fillTotal)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              yAxisId="new"
              type="monotone"
              dataKey="new_members"
              stroke="var(--color-new_members)"
              fill="url(#fillNew)"
              strokeWidth={2}
              dot={{ fill: "var(--color-new_members)", r: 3 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
