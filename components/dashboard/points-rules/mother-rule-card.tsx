import { Calculator, Info, Pencil, Shield } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");
const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export type MotherRule = {
  id: number;
  ruleType: string;
  config: Record<string, unknown>;
  branchName: string | null;
};

function readNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Frase corta que resume la regla, como en el diseño. */
function summarise(
  rule: MotherRule,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  switch (rule.ruleType) {
    case "fixed_amount": {
      const points = readNumber(rule.config.points_per_dollar);
      return points === null
        ? null
        // Cada $100, no cada $1: es la misma base que usa previewPoints y que
        // dice el formulario ("Puntos por cada $100").
        : t("summary.fixedAmount", { points, amount: CURRENCY_FORMATTER.format(100) });
    }
    case "percentage": {
      const percentage = readNumber(rule.config.percentage);
      return percentage === null
        ? null
        : t("summary.percentage", { percentage: NUMBER_FORMATTER.format(percentage) });
    }
    case "fixed_per_item": {
      const points = readNumber(rule.config.points_per_item);
      return points === null ? null : t("summary.perItem", { points });
    }
    default:
      return null;
  }
}

export async function MotherRuleCard({ rule }: { rule: MotherRule | null }) {
  const t = await getTranslations("PointsRules.mother");
  const summary = rule ? summarise(rule, t) : null;

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <Shield className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-brand-blue">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="flex min-w-0 flex-1 items-start gap-2 rounded-lg bg-brand-blue/5 px-3 py-2.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0 text-brand-blue" />
                {t("note")}
              </p>
              {rule && (
                <Link
                  href="/dashboard/points-rules/mother"
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Pencil className="size-4" />
                  {t("editButton")}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t("currentType")}</p>
            <p className="mt-1 text-sm font-bold">
              {rule ? t(`ruleTypes.${rule.ruleType}`) : t("noRule")}
            </p>
            {summary && <p className="mt-1 text-xs text-muted-foreground">{summary}</p>}
            {rule && (
              <p className="mt-1 text-xs text-muted-foreground">
                {rule.branchName
                  ? t("singleBranch", { branch: rule.branchName })
                  : t("allBranches")}
              </p>
            )}
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-violet/10 text-brand-violet">
            <Calculator className="size-5" />
          </span>
        </div>
      </div>
    </section>
  );
}
