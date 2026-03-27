"use client";

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
import type { MonthlyPurchaseStat } from "@/actions/dashboard/analytics/actions";

const chartConfig = {
  revenue: {
    label: "Ingresos ($)",
    color: "var(--chart-4)",
  },
  purchase_count: {
    label: "Compras",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data: MonthlyPurchaseStat[];
};

export function PurchasesOverTimeChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas en el tiempo</CardTitle>
        <CardDescription>
          Ingresos y cantidad de compras de los últimos 6 meses
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
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-purchase_count)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-purchase_count)" stopOpacity={0.05} />
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
              yAxisId="revenue"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={48}
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
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              yAxisId="count"
              type="monotone"
              dataKey="purchase_count"
              stroke="var(--color-purchase_count)"
              fill="url(#fillCount)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
