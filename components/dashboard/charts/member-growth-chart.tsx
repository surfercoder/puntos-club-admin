"use client";

import dynamic from "next/dynamic";

export const MemberGrowthChart = dynamic(
  () => import("./member-growth-chart-view").then((m) => m.MemberGrowthChart),
  { ssr: false },
);
