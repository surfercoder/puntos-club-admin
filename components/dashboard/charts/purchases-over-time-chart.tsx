"use client";

import dynamic from "next/dynamic";

export const PurchasesOverTimeChart = dynamic(
  () =>
    import("./purchases-over-time-chart-view").then(
      (m) => m.PurchasesOverTimeChart,
    ),
  { ssr: false },
);
