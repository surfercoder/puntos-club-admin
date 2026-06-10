"use client";

import { useTranslations } from "next-intl";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
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
import type { OrganizationUsageSummary } from "@/types/plan";

const FEATURE_KEYS = [
  "beneficiaries",
  "push_notifications_monthly",
  "cashiers",
  "branches",
  "collaborators",
  "redeemable_products",
] as const;

type FeatureKey = (typeof FEATURE_KEYS)[number];

const FEATURE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type Props = {
  data: OrganizationUsageSummary;
};

export function PlanUsageChart({ data }: Props) {
  const t = useTranslations("Dashboard.analytics.planUsage");
  const tFeatures = useTranslations("Dashboard.analytics.planUsage.features");

  const labelForFeature = (key: string) =>
    (FEATURE_KEYS as readonly string[]).includes(key)
      ? tFeatures(key as FeatureKey)
      : key;

  const chartData = data.features.map((f, i) => ({
    feature: labelForFeature(f.feature),
    usage_percentage: Math.min(f.usage_percentage, 100),
    current: f.current_usage,
    limit: f.limit_value,
    fill: FEATURE_COLORS[i % FEATURE_COLORS.length],
    is_at_limit: f.is_at_limit,
    should_warn: f.should_warn,
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    chartData.map((d) => [d.feature, { label: d.feature, color: d.fill }])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("descriptionPrefix")}{" "}
          <span className="capitalize font-medium">{data.plan}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {chartData.map((item) => (
            <div key={item.feature} className="flex flex-col items-center gap-1">
              <ChartContainer
                config={chartConfig}
                className="size-[100px]"
              >
                <RadialBarChart
                  data={[item]}
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={30}
                  outerRadius={46}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: "var(--muted)" }}
                    dataKey="usage_percentage"
                    cornerRadius={6}
                    fill={item.fill}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={() => (
                          <span className="text-xs">
                            {item.current}/{item.limit}
                          </span>
                        )}
                      />
                    }
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-xs font-semibold"
                    fontSize={13}
                  >
                    {item.usage_percentage}%
                  </text>
                </RadialBarChart>
              </ChartContainer>
              <span
                className={`text-xs font-medium text-center leading-tight ${
                  item.is_at_limit
                    ? "text-destructive"
                    : item.should_warn
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              >
                {item.feature}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {item.current} / {item.limit}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
