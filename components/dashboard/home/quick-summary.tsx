import { getTranslations } from "next-intl/server";

import { SummaryCard } from "@/components/dashboard/shared/summary-card";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

const points = (value: number) => `${NUMBER_FORMATTER.format(value)} pts`;

export type QuickSummaryData = {
  availablePoints: number;
  pointsGranted: number;
  pointsRedeemed: number;
  totalBeneficiaries: number;
  activeBeneficiaries: number;
};

export async function QuickSummary({
  data,
  months,
}: {
  data: QuickSummaryData;
  months: number;
}) {
  const t = await getTranslations("Dashboard.home.quickSummary");

  return (
    <SummaryCard
      title={t("title")}
      rows={[
        { label: t("availablePoints"), value: points(data.availablePoints), highlight: true },
        { label: t("pointsGranted", { months }), value: points(data.pointsGranted), highlight: true },
        { label: t("pointsRedeemed", { months }), value: points(data.pointsRedeemed), highlight: true },
        { label: t("totalBeneficiaries"), value: NUMBER_FORMATTER.format(data.totalBeneficiaries) },
        { label: t("activeBeneficiaries"), value: NUMBER_FORMATTER.format(data.activeBeneficiaries) },
      ]}
    />
  );
}
