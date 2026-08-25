"use client";

import { CalendarPlus, CircleCheck, Gift, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/charts/kpi-cards";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type BeneficiaryStatsData = {
  total: number;
  active: number;
  withPoints: number;
  averagePoints: number;
  newThisMonth: number;
  newLastMonth: number;
  limit: number | null;
};

function percentage(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function BeneficiaryStats({ data }: { data: BeneficiaryStatsData }) {
  const t = useTranslations("Dashboard.beneficiary.stats");

  const growth =
    data.newLastMonth === 0
      ? data.newThisMonth === 0
        ? 0
        : 100
      : Math.round(((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        title={t("total")}
        value={NUMBER_FORMATTER.format(data.total)}
        subtitle={
          data.limit === null
            ? t("totalNoLimit")
            : t("totalSubtitle", { limit: NUMBER_FORMATTER.format(data.limit) })
        }
        icon={Users}
        tint="bg-brand-blue/10 text-brand-blue"
      />
      <KpiCard
        title={t("active")}
        value={NUMBER_FORMATTER.format(data.active)}
        subtitle={t("percentOfTotal", { percent: percentage(data.active, data.total) })}
        icon={CircleCheck}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("withPoints")}
        value={NUMBER_FORMATTER.format(data.withPoints)}
        subtitle={t("percentOfTotal", { percent: percentage(data.withPoints, data.total) })}
        icon={Star}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("averagePoints")}
        value={NUMBER_FORMATTER.format(data.averagePoints)}
        subtitle={t("averagePointsSubtitle")}
        icon={Gift}
        tint="bg-brand-pink/10 text-brand-pink"
      />
      <KpiCard
        title={t("newThisMonth")}
        value={NUMBER_FORMATTER.format(data.newThisMonth)}
        subtitle={
          <span className={growth >= 0 ? "text-brand-green" : "text-destructive"}>
            {t("growth", { growth: growth > 0 ? `+${growth}` : String(growth) })}
          </span>
        }
        icon={CalendarPlus}
        tint="bg-brand-violet/10 text-brand-violet"
      />
    </div>
  );
}
