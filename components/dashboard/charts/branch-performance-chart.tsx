"use client";

import dynamic from "next/dynamic";

export const BranchPerformanceChart = dynamic(
  () => import("./branch-performance-chart-view").then((m) => m.BranchPerformanceChart),
  { ssr: false },
);
