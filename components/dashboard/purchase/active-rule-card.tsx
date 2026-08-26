import { ArrowRight, Calculator, CircleCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});
const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

/** Una regla que aplica a la operación. Los puntos son su aporte sobre el monto
 * de muestra: desde el 26/08/2026 las reglas suman, no compite una sola. */
export type ActiveRule = {
  id: number;
  name: string;
  isDefault: boolean;
  validFrom: string | null;
  validUntil: string | null;
  points: number;
};

export type ActiveRules = {
  rules: ActiveRule[];
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

export async function ActiveRuleCard({ rules }: { rules: ActiveRules | null }) {
  const t = await getTranslations("Dashboard.purchase.rulePanel");
  const list = rules?.rules ?? [];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>

        {list.length > 0 ? (
          <div className="mt-4 space-y-2">
            {list.map((rule) => {
              const range = formatRange(rule.validFrom, rule.validUntil);
              return (
                <div key={rule.id} className="rounded-xl border bg-brand-green/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-brand-green">
                      <CircleCheck className="size-4 shrink-0" />
                      <span className="truncate">{rule.name}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-brand-green/15 px-2 py-0.5 text-[11px] font-medium text-brand-green">
                      {rule.isDefault ? t("motherRule") : t("campaign")}
                    </span>
                  </div>
                  {range && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("validity", { range })}
                    </p>
                  )}
                </div>
              );
            })}
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

      {rules && list.length > 0 && (
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold">{t("previewTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("previewSubtitle")}</p>

          <p className="mt-4 text-xs text-muted-foreground">{t("previewIf")}</p>
          <p className="mt-1 text-sm font-semibold">
            {CURRENCY_FORMATTER.format(rules.sampleAmount)}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-brand-blue/5 p-3">
            <div className="min-w-0">
              <p className="text-xs text-brand-blue">{t("previewResult")}</p>
              <p className="text-lg font-bold text-brand-blue">
                {NUMBER_FORMATTER.format(rules.samplePoints)} pts
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <Calculator className="size-3.5" />
              {t("previewAuto")}
            </span>
          </div>

          {/* El total es la suma de estos aportes: sin el desglose, un club con
              campañas ve un número que no coincide con ninguna regla suelta. */}
          <ul className="mt-3 space-y-1.5">
            {list.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-muted-foreground">{rule.name}</span>
                <span className="shrink-0 font-semibold text-brand-green">
                  +{NUMBER_FORMATTER.format(rule.points)} pts
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {t("previewNote")}
          </p>
        </section>
      )}
    </div>
  );
}
