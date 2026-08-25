"use client";

import { CircleCheck, CircleSlash, Store, UserCog, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/charts/kpi-cards";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type StaffStatsData = {
  total: number;
  active: number;
  inactive: number;
  /** Cajeros con sucursal asignada, u operaciones del mes según la pantalla. */
  extra: number;
  limit: number | null;
};

export function StaffStats({
  data,
  variant,
}: {
  data: StaffStatsData;
  variant: "cashiers" | "collaborators";
}) {
  const t = useTranslations(`Dashboard.staff.${variant}.stats`);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title={t("total")}
        value={NUMBER_FORMATTER.format(data.total)}
        subtitle={
          data.limit === null
            ? t("noLimit")
            : t("ofLimit", { limit: NUMBER_FORMATTER.format(data.limit) })
        }
        icon={variant === "cashiers" ? Users : UserCog}
        tint="bg-brand-violet/10 text-brand-violet"
      />
      <KpiCard
        title={t("active")}
        value={NUMBER_FORMATTER.format(data.active)}
        subtitle={t("activeSubtitle")}
        icon={CircleCheck}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("inactive")}
        value={NUMBER_FORMATTER.format(data.inactive)}
        subtitle={t("inactiveSubtitle")}
        icon={CircleSlash}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("extra")}
        value={NUMBER_FORMATTER.format(data.extra)}
        subtitle={t("extraSubtitle")}
        icon={Store}
        tint="bg-brand-blue/10 text-brand-blue"
      />
    </div>
  );
}
