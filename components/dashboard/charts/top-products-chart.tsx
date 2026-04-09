"use client";

import dynamic from "next/dynamic";

export const TopProductsChart = dynamic(
  () => import("./top-products-chart-view").then((m) => m.TopProductsChart),
  { ssr: false },
);
