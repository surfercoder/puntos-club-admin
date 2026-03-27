import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isAdmin, isCollaborator, isOwner } from "@/lib/auth/roles";
import { getUsageSummaryAction } from "@/actions/dashboard/usage/actions";
import {
  getDashboardKpis,
  getMonthlyPurchaseStats,
  getMonthlyPointsStats,
  getMonthlyMemberStats,
  getTopProducts,
  getBranchPerformance,
} from "@/actions/dashboard/analytics/actions";
import { KpiCards } from "@/components/dashboard/charts/kpi-cards";
import { PurchasesOverTimeChart } from "@/components/dashboard/charts/purchases-over-time-chart";
import { PointsEconomyChart } from "@/components/dashboard/charts/points-economy-chart";
import { MemberGrowthChart } from "@/components/dashboard/charts/member-growth-chart";
import { TopProductsChart } from "@/components/dashboard/charts/top-products-chart";
import { BranchPerformanceChart } from "@/components/dashboard/charts/branch-performance-chart";
import { PlanUsageChart } from "@/components/dashboard/charts/plan-usage-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const currentUser = await getCurrentUser();
  const hasAnalyticsAccess =
    currentUser && (isOwner(currentUser) || isCollaborator(currentUser) || isAdmin(currentUser));

  if (!hasAnalyticsAccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0">
        <p className="text-muted-foreground text-sm">
          No tienes acceso al panel de métricas.
        </p>
      </div>
    );
  }

  const [
    kpis,
    monthlyPurchases,
    monthlyPoints,
    monthlyMembers,
    topProducts,
    branchPerformance,
    usageSummary,
  ] = await Promise.all([
    getDashboardKpis(),
    getMonthlyPurchaseStats(6),
    getMonthlyPointsStats(6),
    getMonthlyMemberStats(12),
    getTopProducts(8),
    getBranchPerformance(),
    getUsageSummaryAction(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-4">
      {/* KPI Summary */}
      {kpis && <KpiCards data={kpis} />}

      {/* Row 1: Revenue trend + Points economy */}
      <div className="grid gap-4 md:grid-cols-2">
        <PurchasesOverTimeChart data={monthlyPurchases} />
        <PointsEconomyChart data={monthlyPoints} />
      </div>

      {/* Row 2: Member growth (full width) */}
      <MemberGrowthChart data={monthlyMembers} />

      {/* Row 3: Top products + Branch performance */}
      <div className="grid gap-4 md:grid-cols-2">
        {topProducts.length > 0 ? (
          <TopProductsChart data={topProducts} />
        ) : (
          <EmptyChartCard
            title="Productos más canjeados"
            message="Aún no hay canjes registrados."
          />
        )}
        {branchPerformance.length > 0 ? (
          <BranchPerformanceChart data={branchPerformance} />
        ) : (
          <EmptyChartCard
            title="Rendimiento por sucursal"
            message="Aún no hay compras por sucursal."
          />
        )}
      </div>

      {/* Row 4: Plan usage */}
      {usageSummary && <PlanUsageChart data={usageSummary} />}
    </div>
  );
}

function EmptyChartCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
