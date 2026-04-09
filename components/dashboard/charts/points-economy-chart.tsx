"use client";

import dynamic from "next/dynamic";

export const PointsEconomyChart = dynamic(
  () => import("./points-economy-chart-view").then((m) => m.PointsEconomyChart),
  { ssr: false },
);
