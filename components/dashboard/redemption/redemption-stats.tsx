"use client";

import { Ban, CircleCheck, Clock, Gift, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/charts/kpi-cards";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type RedemptionStatsData = {
  total: number;
  pointsUsed: number;
  pending: number;
  delivered: number;
  cancelled: number;
};

export function RedemptionStats({ data }: { data: RedemptionStatsData }) {
  const t = useTranslations("Dashboard.redemption.stats");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        title={t("total")}
        value={NUMBER_FORMATTER.format(data.total)}
        subtitle={t("inPeriod")}
        icon={Gift}
        tint="bg-brand-violet/10 text-brand-violet"
      />
      <KpiCard
        title={t("pointsUsed")}
        value={`${NUMBER_FORMATTER.format(data.pointsUsed)} pts`}
        subtitle={t("inPeriod")}
        icon={Ticket}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("pending")}
        value={NUMBER_FORMATTER.format(data.pending)}
        subtitle={t("pendingSubtitle")}
        icon={Clock}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("delivered")}
        value={NUMBER_FORMATTER.format(data.delivered)}
        subtitle={t("deliveredSubtitle")}
        icon={CircleCheck}
        tint="bg-brand-blue/10 text-brand-blue"
      />
      <KpiCard
        title={t("cancelled")}
        value={NUMBER_FORMATTER.format(data.cancelled)}
        subtitle={t("cancelledSubtitle")}
        icon={Ban}
        tint="bg-brand-pink/10 text-brand-pink"
      />
    </div>
  );
}
