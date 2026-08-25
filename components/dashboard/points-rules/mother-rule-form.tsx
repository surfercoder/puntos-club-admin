"use client";

import {
  ChevronDown,
  DollarSign,
  Loader2,
  Percent,
  Power,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { updatePointsRule } from "@/actions/dashboard/points-rules/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MOTHER_RULE_TYPES, previewPoints, type MotherRuleType } from "@/lib/utils";

const CURRENCY_FORMATTER = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const SAMPLE_AMOUNTS = [100, 250, 500, 1000];

const TYPE_ICONS = {
  percentage: Percent,
  fixed_amount: DollarSign,
} as const;

const TYPE_TINTS = {
  percentage: "bg-brand-violet/10 text-brand-violet",
  fixed_amount: "bg-brand-blue/10 text-brand-blue",
} as const;

export type MotherRuleFormValues = {
  id: number;
  name: string;
  ruleType: MotherRuleType;
  /** Porcentaje, puntos por $100 o puntos por ítem según el tipo. */
  value: string;
  branchId: string;
  isActive: boolean;
};

type MotherRuleEdits = {
  ruleType: MotherRuleType;
  value: string;
  allBranches: boolean;
  branchId: string;
};

export function MotherRuleForm({
  rule,
  branches,
}: {
  rule: MotherRuleFormValues;
  branches: { id: string; name: string }[];
}) {
  const t = useTranslations("PointsRules.motherForm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Guardamos solo lo que el owner tocó; el resto se deriva de `rule` en cada
  // render, así una regla recargada desde el servidor no queda pisada por una
  // copia vieja en el estado.
  const [edits, setEdits] = useState<Partial<MotherRuleEdits>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const editField = (next: Partial<MotherRuleEdits>) =>
    setEdits((current) => ({ ...current, ...next }));

  const ruleType = edits.ruleType ?? rule.ruleType;
  const value = edits.value ?? rule.value;
  const allBranches = edits.allBranches ?? rule.branchId === "";
  const branchId = edits.branchId ?? rule.branchId;

  const numericValue = Number(value);

  const save = (nextActive?: boolean) => {
    // No dejamos salir una regla madre que el motor de puntos no podría aplicar:
    // sin valor numérico, o acotada a una sucursal que nadie eligió.
    if (value.trim() === "" || !Number.isFinite(numericValue)) {
      toast.error(t("invalidValue"));
      return;
    }
    if (!allBranches && branchId === "") {
      toast.error(t("branchRequired"));
      return;
    }

    startTransition(async () => {
      const config =
        ruleType === "percentage"
          ? { percentage: numericValue }
          : { points_per_dollar: numericValue };

      const result = await updatePointsRule(rule.id, {
        rule_type: ruleType,
        config,
        is_default: true,
        branch_id: allBranches ? undefined : Number(branchId),
        ...(nextActive === undefined ? {} : { is_active: nextActive }),
      });

      if (!result.success) {
        toast.error(result.error || t("saveError"));
        return;
      }
      toast.success(nextActive === false ? t("deactivated") : t("saved"));
      router.push("/dashboard/points-rules");
      router.refresh();
    });
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("typeTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("typeSubtitle")}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {MOTHER_RULE_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const selected = ruleType === type;
              return (
                <label
                  key={type}
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    selected ? "border-brand-violet bg-brand-violet/5" : "hover:bg-accent"
                  }`}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    name="rule_type"
                    onChange={() => editField({ ruleType: type })}
                    type="radio"
                  />
                  <span
                    className={`grid size-9 place-items-center rounded-xl ${TYPE_TINTS[type]}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="mt-3 block text-sm font-semibold">{t(`types.${type}.title`)}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t(`types.${type}.description`)}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("configTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("configSubtitle")}</p>

          <div className="mt-4 max-w-sm">
            <Label htmlFor="rule-value">
              {t(`valueLabel.${ruleType}`)} <span className="text-destructive">*</span>
            </Label>
            <div className="mt-1.5 flex">
              <Input
                id="rule-value"
                min={0}
                onChange={(event) => editField({ value: event.target.value })}
                step="0.01"
                type="number"
                value={value}
                className="rounded-r-none"
              />
              <span className="grid place-items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground">
                {ruleType === "percentage" ? "%" : "pts"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{t(`valueHelp.${ruleType}`)}</p>
          </div>

          <div className="mt-4 rounded-lg bg-brand-violet/5 p-4 text-sm">
            <p className="font-medium">
              {t(`summary.${ruleType}`, {
                value: numericValue || 0,
                points: previewPoints(ruleType, numericValue, 100),
                amount: CURRENCY_FORMATTER.format(100),
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {allBranches ? t("appliesEverywhere") : t("appliesToBranch")}
            </p>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <Switch
              aria-label={t("allBranchesLabel")}
              checked={allBranches}
              onCheckedChange={(checked) => editField({ allBranches: checked })}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("allBranchesLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("allBranchesHelp")}</p>
            </div>
          </div>

          {!allBranches && (
            <div className="mt-4 max-w-sm">
              <Label htmlFor="rule-branch">{t("branchLabel")}</Label>
              <Select onValueChange={(next) => editField({ branchId: next })} value={branchId}>
                <SelectTrigger className="mt-1.5 w-full" id="rule-branch">
                  <SelectValue placeholder={t("branchPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card shadow-sm">
          <button
            aria-expanded={previewOpen}
            className="flex w-full cursor-pointer items-center justify-between gap-3 p-5 text-left"
            onClick={() => setPreviewOpen((open) => !open)}
            type="button"
          >
            <span>
              <span className="block text-base font-semibold">{t("previewTitle")}</span>
              <span className="block text-sm text-muted-foreground">{t("previewSubtitle")}</span>
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                previewOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {previewOpen && (
            <ul className="space-y-2 border-t p-5 text-sm">
              {SAMPLE_AMOUNTS.map((amount) => (
                <li key={amount} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {CURRENCY_FORMATTER.format(amount)}
                  </span>
                  <span className="font-semibold text-brand-violet">
                    {t("previewPoints", {
                      points: previewPoints(ruleType, numericValue, amount),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            className="mr-auto text-destructive hover:text-destructive"
            disabled={pending || !rule.isActive}
            onClick={() => save(false)}
            type="button"
            variant="outline"
          >
            <Power className="size-4" />
            {t("deactivate")}
          </Button>
          <Button asChild type="button" variant="secondary">
            <Link href="/dashboard/points-rules">{tCommon("cancel")}</Link>
          </Button>
          <Button className="brand-cta" disabled={pending} onClick={() => save()} type="button">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {tCommon("saveChanges")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("howTitle")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {["base", "always", "campaigns", "everywhere"].map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-blue" />
                {t(`how.${key}`)}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold">{t("examplesTitle")}</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">{t("examplesAmount")}</th>
                <th className="pb-2 text-right font-medium">{t("examplesPoints")}</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_AMOUNTS.map((amount) => (
                <tr key={amount} className="border-b last:border-0">
                  <td className="py-2.5">{CURRENCY_FORMATTER.format(amount)}</td>
                  <td className="py-2.5 text-right font-semibold">
                    {t("previewPoints", {
                      points: previewPoints(ruleType, numericValue, amount),
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-muted-foreground">{t("examplesNote")}</p>
        </section>
      </div>
    </div>
  );
}
