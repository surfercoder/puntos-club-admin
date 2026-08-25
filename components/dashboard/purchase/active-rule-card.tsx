import { ArrowRight, Calculator, CircleCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});
const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

export type ActiveRule = {
  id: number;
  name: string;
  ruleType: string;
  isDefault: boolean;
  validFrom: string | null;
  validUntil: string | null;
  /** Importe de referencia de la regla; null cuando no aplica al tipo. */
  perAmount: number | null;
  /** Puntos que otorga por ese importe (o por ítem, según el tipo). */
  points: number | null;
  /** Puntos que generaría una venta de $1.000, para la vista previa. */
  sampleAmount: number;
  samplePoints: number;
};

function formatRange(from: string | null, until: string | null) {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    });
  if (from && until) return `${format(from)} - ${format(until)}`;
  if (from) return format(from);
  /* c8 ignore next */
  if (until) return format(until);
  return null;
}

export async function ActiveRuleCard({ rule }: { rule: ActiveRule | null }) {
  const t = await getTranslations("Dashboard.purchase.rulePanel");
  const range = rule ? formatRange(rule.validFrom, rule.validUntil) : null;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>

        {rule ? (
          <div className="mt-4 rounded-xl border bg-brand-green/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-green">
                <CircleCheck className="size-4" />
                {t("activeRule")}
              </span>
              <span className="rounded-md bg-brand-green/15 px-2 py-0.5 text-[11px] font-medium text-brand-green">
                {rule.isDefault ? t("motherRule") : t("campaign")}
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold">{rule.name}</p>
            {range && (
              <p className="text-xs text-muted-foreground">{t("validity", { range })}</p>
            )}

            {rule.points !== null && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{t("perEach")}</p>
                  <p className="truncate text-sm font-bold">
                    {rule.perAmount === null
                      ? t("perItem")
                      : CURRENCY_FORMATTER.format(rule.perAmount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t("ofPurchase")}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{t("grants")}</p>
                  <p className="truncate text-sm font-bold text-brand-green">
                    {NUMBER_FORMATTER.format(rule.points)} pts
                  </p>
                  <p className="text-[11px] text-muted-foreground">{t("toBeneficiary")}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {t("noRule")}
          </p>
        )}

        <Link
          href="/dashboard/points-rules"
          className="mt-4 flex items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("allRules")}
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="rounded-xl border bg-brand-blue/5 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <HelpCircle className="size-4 text-brand-blue" />
          {t("howTitle")}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("howSale")}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {t("howAssignment")}
        </p>
      </section>

      {rule && (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">{t("previewTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("previewSubtitle")}</p>

          <p className="mt-4 text-xs text-muted-foreground">{t("previewIf")}</p>
          <p className="mt-1 text-sm font-semibold">
            {CURRENCY_FORMATTER.format(rule.sampleAmount)}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-brand-blue/5 p-3">
            <div className="min-w-0">
              <p className="text-xs text-brand-blue">{t("previewResult")}</p>
              <p className="text-lg font-bold text-brand-blue">
                {NUMBER_FORMATTER.format(rule.samplePoints)} pts
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <Calculator className="size-3.5" />
              {t("previewAuto")}
            </span>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t("previewNote")}
          </p>
        </section>
      )}
    </div>
  );
}
