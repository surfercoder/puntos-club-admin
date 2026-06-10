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
import { useTranslations } from "next-intl";
import type { MonthlyPointsStat } from "@/actions/dashboard/analytics/actions";

type Props = {
  data: MonthlyPointsStat[];
};

export function PointsEconomyChart({ data }: Props) {
  const t = useTranslations("Dashboard.analytics.pointsEconomy");
  const chartConfig = {
    points_earned: {
      label: t("earnedLabel"),
      color: "var(--chart-1)",
    },
    points_redeemed: {
      label: t("redeemedLabel"),
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
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
