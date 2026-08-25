"use client";

import { ArrowLeftRight, CalendarClock, Database, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/charts/kpi-cards";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export type PurchaseStatsData = {
  operations: number;
  totalAmount: number;
  pointsAssigned: number;
  beneficiariesReached: number;
  averagePoints: number;
};

export function PurchaseStats({ data }: { data: PurchaseStatsData }) {
  const t = useTranslations("Dashboard.purchase.stats");
  const subtitle = t("inPeriod");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        title={t("operations")}
        value={NUMBER_FORMATTER.format(data.operations)}
        subtitle={subtitle}
        icon={ArrowLeftRight}
        tint="bg-brand-violet/10 text-brand-violet"
      />
      <KpiCard
        title={t("totalAmount")}
        value={CURRENCY_FORMATTER.format(data.totalAmount)}
        subtitle={subtitle}
        icon={Database}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("pointsAssigned")}
        value={`${NUMBER_FORMATTER.format(data.pointsAssigned)} pts`}
        subtitle={subtitle}
        icon={Star}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("beneficiariesReached")}
        value={NUMBER_FORMATTER.format(data.beneficiariesReached)}
        subtitle={subtitle}
        icon={Users}
        tint="bg-brand-blue/10 text-brand-blue"
      />
      <KpiCard
        title={t("averagePoints")}
        value={`${NUMBER_FORMATTER.format(data.averagePoints)} pts`}
        subtitle={subtitle}
        icon={CalendarClock}
        tint="bg-brand-pink/10 text-brand-pink"
      />
    </div>
  );
}
