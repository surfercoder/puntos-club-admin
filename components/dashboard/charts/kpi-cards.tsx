"use client";

import { useTranslations } from "next-intl";
import type { DashboardKpis } from "@/actions/dashboard/analytics/actions";
import { Users, ShoppingCart, Star, TrendingUp, Gift, Coins } from "lucide-react";

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

function formatCurrency(value: number) {
  return CURRENCY_FORMATTER.format(value);
}

function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  /** Clases de fondo + color para el cuadro del ícono. */
  tint: string;
};

export function KpiCard({ title, value, subtitle, icon: Icon, tint }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tint}`}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 text-[12.5px] font-medium leading-tight text-muted-foreground">
          {title}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <div className="mt-1.5 text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

type KpiCardsProps = {
  data: DashboardKpis;
};

export function KpiCards({ data }: KpiCardsProps) {
  const t = useTranslations("Dashboard.analytics.kpi");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        title={t("activeMembers")}
        value={formatNumber(data.total_active_members)}
        subtitle={t("activeMembersSubtitle")}
        icon={Users}
        tint="bg-brand-blue/10 text-brand-blue"
      />
      <KpiCard
        title={t("monthlyRevenue")}
        value={formatCurrency(data.revenue_this_month)}
        subtitle={t("monthlyRevenueSubtitle")}
        icon={TrendingUp}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("monthlyPurchases")}
        value={formatNumber(data.purchases_this_month)}
        subtitle={t("monthlyPurchasesSubtitle")}
        icon={ShoppingCart}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("pointsInCirculation")}
        value={formatNumber(data.points_in_circulation)}
        subtitle={t("pointsInCirculationSubtitle")}
        icon={Coins}
        tint="bg-brand-pink/10 text-brand-pink"
      />
      <KpiCard
        title={t("monthlyRedemptions")}
        value={formatNumber(data.redemptions_this_month)}
        subtitle={t("monthlyRedemptionsSubtitle")}
        icon={Gift}
        tint="bg-brand-violet/10 text-brand-violet"
      />
      <KpiCard
        title={t("pointsRedeemed")}
        value={formatNumber(data.points_redeemed_this_month)}
        subtitle={t("pointsRedeemedSubtitle")}
        icon={Star}
        tint="bg-brand-pink/10 text-brand-pink"
      />
    </div>
  );
}
