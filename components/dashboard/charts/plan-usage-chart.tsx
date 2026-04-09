"use client";

import dynamic from "next/dynamic";

export const PlanUsageChart = dynamic(
  () => import("./plan-usage-chart-view").then((m) => m.PlanUsageChart),
  { ssr: false },
);
