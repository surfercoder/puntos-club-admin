import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasOwnerPermissions } from "@/lib/auth/roles";
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
import { DashboardHero } from "@/components/dashboard/home/dashboard-hero";
import { HelpCard } from "@/components/dashboard/home/help-card";
import { QuickActions } from "@/components/dashboard/home/quick-actions";
import { QuickSummary } from "@/components/dashboard/home/quick-summary";
import { parseDashboardRange } from "@/lib/utils";

const MEMBER_GROWTH_MONTHS = 12;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  const [t, currentUser, resolvedSearchParams] = await Promise.all([
    getTranslations("Dashboard.analytics"),
    getCurrentUser(),
    searchParams,
  ]);
  const hasAnalyticsAccess = hasOwnerPermissions(currentUser);

  if (!hasAnalyticsAccess) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 pt-0">
        <p className="text-muted-foreground text-sm">
          {t("noAccess")}
        </p>
      </div>
    );
  }

  const months = parseDashboardRange(resolvedSearchParams?.range);

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
    getMonthlyPurchaseStats(months),
    getMonthlyPointsStats(months),
    getMonthlyMemberStats(MEMBER_GROWTH_MONTHS),
    getTopProducts(8),
    getBranchPerformance(),
    getUsageSummaryAction(),
  ]);

  const totalBeneficiaries = usageSummary?.features.find(
    (f) => f.feature === "beneficiaries",
  )?.current_usage;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-4 pt-2">
      <DashboardHero
        firstName={currentUser?.first_name ?? currentUser?.email ?? ""}
        organizationName={currentUser?.organization?.name ?? "PuntosClub"}
        range={months}
      />

      {kpis && <KpiCards data={kpis} />}

      {/* La columna 4 es el rail del mockup: cada tarjeta arranca en la misma
          fila que el bloque de gráficos que tiene al lado. */}
      <div className="grid items-start gap-4 xl:grid-cols-4">
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-3">
          <PurchasesOverTimeChart data={monthlyPurchases} months={months} />
          <PointsEconomyChart data={monthlyPoints} months={months} />
        </div>
        <QuickActions />

        <div className="xl:col-span-3">
          <MemberGrowthChart data={monthlyMembers} />
        </div>
        <QuickSummary
          months={months}
          data={{
            availablePoints: kpis?.points_in_circulation ?? 0,
            pointsGranted: monthlyPoints.reduce((sum, m) => sum + m.points_earned, 0),
            pointsRedeemed: monthlyPoints.reduce((sum, m) => sum + m.points_redeemed, 0),
            totalBeneficiaries: totalBeneficiaries ?? kpis?.total_active_members ?? 0,
            activeBeneficiaries: kpis?.total_active_members ?? 0,
          }}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:col-span-3">
          {topProducts.length > 0 ? (
            <TopProductsChart data={topProducts} />
          ) : (
            <EmptyChartCard
              title={t("topProducts.title")}
              message={t("topProducts.emptyMessage")}
            />
          )}
          {branchPerformance.length > 0 ? (
            <BranchPerformanceChart data={branchPerformance} />
          ) : (
            <EmptyChartCard
              title={t("branchPerformance.title")}
              message={t("branchPerformance.emptyMessage")}
            />
          )}
        </div>
        <HelpCard />
      </div>

      {usageSummary && <PlanUsageChart data={usageSummary} />}
    </div>
  );
}

function EmptyChartCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
