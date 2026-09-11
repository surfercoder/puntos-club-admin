import { TriangleAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CampaignForm } from "@/components/dashboard/points-rules/campaign-form";
import { CampaignPageHeader } from "@/components/dashboard/points-rules/campaign-page-header";
import {
  ASSIGNMENT_TYPES,
  type AssignmentType,
  type CampaignBranch,
  type CampaignFormValues,
} from "@/components/dashboard/points-rules/campaign-values";
import { getActiveOrgIdFilter } from "@/lib/auth/get-active-org-id";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

type RuleRow = {
  id: number;
  name: string;
  display_name: string | null;
  description: string | null;
  rule_type: string;
  config: Record<string, unknown> | null;
  start_date: string | null;
  end_date: string | null;
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  branch_id: number | null;
  branch_ids: number[] | null;
};

const toNumberText = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : "";
};

/**
 * Pasa la fila guardada al estado del formulario. `legacyType` avisa que la
 * regla es de un tipo viejo (`fixed_amount` = puntos por cada $1, `tiered`, …)
 * que esta pantalla no sabe editar: el valor se deja vacío para que el owner
 * vuelva a elegirlo en vez de reinterpretar el número con otra unidad.
 */
function toFormValues(rule: RuleRow, branches: CampaignBranch[]) {
  const config = rule.config ?? {};
  const active = new Set(branches.map((branch) => branch.id));
  const legacyType = !(ASSIGNMENT_TYPES as readonly string[]).includes(rule.rule_type);
  const assignment: AssignmentType =
    rule.rule_type === "percentage" ? "percentage" : "fixed_per_sale";

  const initial: CampaignFormValues = {
    name: rule.display_name || rule.name,
    description: rule.description ?? "",
    startDate: rule.start_date ?? "",
    endDate: rule.end_date ?? "",
    daysOfWeek: rule.days_of_week ?? [],
    timeStart: rule.time_start?.slice(0, 5) ?? "",
    timeEnd: rule.time_end?.slice(0, 5) ?? "",
    assignment,
    points: legacyType ? "" : toNumberText(config.points_per_sale),
    percentage: assignment === "percentage" ? toNumberText(config.percentage) : "",
    // branch_ids nulo = todas; branch_id suelto es la campaña vieja de una sola.
    // Se descartan las sucursales dadas de baja: el owner no las ve en la lista
    // y, si quedaran contadas, una campaña acotada podría guardarse como "todas".
    branchIds:
      rule.branch_ids?.flatMap((id) => (active.has(String(id)) ? [String(id)] : [])) ??
      (rule.branch_id === null ? branches.map((branch) => branch.id) : [String(rule.branch_id)]),
  };

  return { initial, legacyType };
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [t, currentUser, supabase, { id }] = await Promise.all([
    getTranslations("PointsRules.campaignForm"),
    getCurrentUser(),
    createClient(),
    params,
  ]);
  const orgIdFilter = await getActiveOrgIdFilter(currentUser);

  if (!orgIdFilter) {
    return <p className="text-sm text-muted-foreground">{t("noOrganization")}</p>;
  }

  const [{ data: ruleRows }, { data: branchRows }] = await Promise.all([
    supabase
      .from("points_rule")
      .select(
        "id, name, display_name, description, rule_type, config, start_date, end_date, days_of_week, time_start, time_end, branch_id, branch_ids",
      )
      .eq("id", Number(id))
      .eq("organization_id", orgIdFilter)
      .limit(1),
    supabase
      .from("branch")
      .select("id, name")
      .eq("organization_id", orgIdFilter)
      .eq("active", true)
      .order("name"),
  ]);

  const rule = (ruleRows ?? [])[0] as RuleRow | undefined;
  const branches = (branchRows ?? []).map((branch) => ({
    id: String(branch.id),
    name: branch.name as string,
  }));

  if (!rule) {
    return (
      <div className="space-y-4">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          href="/dashboard/points-rules"
        >
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {t("notFound")}
        </p>
      </div>
    );
  }

  const { initial, legacyType } = toFormValues(rule, branches);

  return (
    <div className="space-y-6">
      <CampaignPageHeader
        back={t("back")}
        subtitle={t("editSubtitle")}
        title={t("editTitle")}
      />

      {legacyType && (
        <p className="flex items-start gap-2 rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-4 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-brand-orange" />
          {t("legacyType")}
        </p>
      )}

      <CampaignForm branches={branches} campaignId={rule.id} initial={initial} />
    </div>
  );
}
