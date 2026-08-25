"use client";

import { CheckCircle2, Gauge, Send, TriangleAlert, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

import { KpiCard } from "@/components/dashboard/charts/kpi-cards";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type NotificationStatsData = {
  sent: number;
  delivered: number;
  failed: number;
  remaining: number | null;
  monthlyLimit: number | null;
};

function percentage(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function NotificationStats({ data }: { data: NotificationStatsData }) {
  const t = useTranslations("Dashboard.notifications.stats");
  const deliveryRate = percentage(data.delivered, data.sent);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        title={t("sent")}
        value={NUMBER_FORMATTER.format(data.sent)}
        subtitle={t("sentSubtitle")}
        icon={Send}
        tint="bg-brand-violet/10 text-brand-violet"
      />
      <KpiCard
        title={t("delivered")}
        value={NUMBER_FORMATTER.format(data.delivered)}
        subtitle={t("ofSent", { percent: deliveryRate })}
        icon={CheckCircle2}
        tint="bg-brand-green/10 text-brand-green"
      />
      <KpiCard
        title={t("failed")}
        value={NUMBER_FORMATTER.format(data.failed)}
        subtitle={t("ofSent", { percent: percentage(data.failed, data.sent) })}
        icon={TriangleAlert}
        tint="bg-brand-pink/10 text-brand-pink"
      />
      <KpiCard
        title={t("deliveryRate")}
        value={`${deliveryRate}%`}
        subtitle={
          <span className={deliveryRate >= 90 ? "text-brand-green" : undefined}>
            {deliveryRate >= 90 ? t("excellent") : t("deliveryRateSubtitle")}
          </span>
        }
        icon={Gauge}
        tint="bg-brand-orange/10 text-brand-orange"
      />
      <KpiCard
        title={t("remaining")}
        value={data.remaining === null ? "—" : NUMBER_FORMATTER.format(data.remaining)}
        subtitle={
          data.monthlyLimit === null
            ? t("remainingNoLimit")
            : t("remainingSubtitle", { limit: NUMBER_FORMATTER.format(data.monthlyLimit) })
        }
        icon={Wallet}
        tint="bg-brand-blue/10 text-brand-blue"
      />
    </div>
  );
}
