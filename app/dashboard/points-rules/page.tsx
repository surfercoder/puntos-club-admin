import { BookOpen, Lightbulb } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getAllPointsRules } from "@/actions/dashboard/points-rules/actions";
import { Clubi } from "@/components/dashboard/home/clubi";
import {
  CampaignsCard,
  type Campaign,
} from "@/components/dashboard/points-rules/campaigns-card";
import {
  MotherRuleCard,
  type MotherRule,
} from "@/components/dashboard/points-rules/mother-rule-card";
import { CAMPAIGN_TABS, type CampaignTab } from "@/lib/utils";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

type RuleRow = {
  id: number;
  name: string;
  description: string | null;
  rule_type: string;
  config: Record<string, unknown> | null;
  is_active: boolean;
  is_default: boolean | null;
  display_icon: string | null;
  display_name: string | null;
  start_date: string | null;
  end_date: string | null;
  time_start: string | null;
  time_end: string | null;
  days_of_week: number[] | null;
  branch: { name: string } | null;
};

function toDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

/** Una campaña es programada si arranca en el futuro y finalizada si ya venció. */
function classify(rule: RuleRow, today: Date): CampaignTab {
  const start = toDate(rule.start_date);
  const end = toDate(rule.end_date);
  if (end && end < today) return "finished";
  if (!rule.is_active) return "finished";
  if (start && start > today) return "scheduled";
  return "active";
}

export default async function PointsRulesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [t, tMother, tCampaigns, params, result] = await Promise.all([
    getTranslations("PointsRules"),
    getTranslations("PointsRules.mother"),
    getTranslations("PointsRules.campaigns"),
    searchParams,
    getAllPointsRules(),
  ]);

  const rules = (result.success ? (result.data ?? []) : []) as unknown as RuleRow[];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const motherRow = rules.find((rule) => rule.is_default);
  const mother: MotherRule | null = motherRow
    ? {
        id: motherRow.id,
        ruleType: motherRow.rule_type,
        config: motherRow.config ?? {},
        branchName: motherRow.branch?.name ?? null,
      }
    : null;

  const describeBenefit = (rule: RuleRow) => {
    const config = rule.config ?? {};
    const points = Number(config.points_per_dollar ?? config.points_per_item);
    const percentage = Number(config.percentage);
    if (Number.isFinite(percentage) && rule.rule_type === "percentage") {
      return tCampaigns("benefit.percentage", {
        percentage: NUMBER_FORMATTER.format(percentage),
      });
    }
    if (Number.isFinite(points)) {
      return tCampaigns("benefit.points", { points: NUMBER_FORMATTER.format(points) });
    }
    return tCampaigns("benefit.custom");
  };

  const describeValidity = (rule: RuleRow) => {
    const format = (value: string) =>
      new Date(`${value}T00:00:00Z`).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      });
    if (rule.start_date && rule.end_date) {
      return `${format(rule.start_date)} – ${format(rule.end_date)}`;
    }
    if (rule.start_date) return tCampaigns("validity.from", { date: format(rule.start_date) });
    if (rule.end_date) return tCampaigns("validity.until", { date: format(rule.end_date) });
    return tCampaigns("validity.always");
  };

  const describeSchedule = (rule: RuleRow) => {
    if (!rule.time_start && !rule.time_end) return tCampaigns("schedule.allDay");
    return `${rule.time_start?.slice(0, 5) ?? "00:00"} – ${rule.time_end?.slice(0, 5) ?? "23:59"}`;
  };

  // Una sola pasada: descartamos la regla madre y armamos la campaña a la vez.
  const campaigns: Campaign[] = rules.flatMap((rule) =>
    rule.is_default
      ? []
      : [{
          id: rule.id,
          name: rule.display_name || rule.name,
          description: rule.description,
          displayIcon: rule.display_icon,
          benefit: describeBenefit(rule),
          benefitDetail: rule.description ? null : tCampaigns("benefit.overMother"),
          appliesTo: rule.branch?.name ?? tMother("allBranches"),
          validity: describeValidity(rule),
          schedule: describeSchedule(rule),
          tab: classify(rule, today),
          isActive: rule.is_active,
        }],
  );

  const tab = (CAMPAIGN_TABS as readonly string[]).includes(params.tab ?? "")
    ? (params.tab as CampaignTab)
    : "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Link
          href="/dashboard/points-rules/new"
          className="brand-cta inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium"
        >
          {t("createButton")}
        </Link>
      </div>

      <MotherRuleCard rule={mother} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <CampaignsCard campaigns={campaigns} tab={tab} />
        </div>

        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">{t("howItWorks.title")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("howItWorks.subtitle")}</p>
            <ol className="mt-4 space-y-3">
              {["first", "second", "third"].map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-violet/10 text-xs font-semibold text-brand-violet">
                    {index + 1}
                  </span>
                  {t(`howItWorks.${step}`)}
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-xl border bg-brand-orange/5 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="size-4 text-brand-orange" />
              {t("tip.title")}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("tip.body")}
            </p>
          </section>
        </div>
      </div>

      <section className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <Clubi accent="#FF4573" className="h-16 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("help.title")}</p>
          <p className="text-xs text-muted-foreground">{t("help.body")}</p>
        </div>
        <Link
          href="/dashboard/points-rules/new"
          className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          <BookOpen className="size-4" />
          {t("help.cta")}
        </Link>
      </section>
    </div>
  );
}
