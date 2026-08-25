import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  FILTER_FIELD_CLASS,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";

export type BranchFilterValues = {
  q: string;
  status: string;
  cashier: string;
};

export async function BranchFilters({ values }: { values: BranchFilterValues }) {
  const t = await getTranslations("Dashboard.branch.filters");

  return (
    <FilterBar className="md:grid-cols-[2fr_1fr_1fr_auto]">
      <FilterSearch
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        defaultValue={values.q}
      />

      <FilterField label={t("status")}>
        <select className={FILTER_FIELD_CLASS} name="status" defaultValue={values.status}>
          <option value="">{t("all")}</option>
          <option value="active">{t("statusActive")}</option>
          <option value="inactive">{t("statusInactive")}</option>
        </select>
      </FilterField>

      <FilterField label={t("cashierStatus")}>
        <select className={FILTER_FIELD_CLASS} name="cashier" defaultValue={values.cashier}>
          <option value="">{t("all")}</option>
          <option value="assigned">{t("cashierAssigned")}</option>
          <option value="unassigned">{t("cashierUnassigned")}</option>
        </select>
      </FilterField>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="brand-cta h-9 cursor-pointer whitespace-nowrap rounded-md px-4 text-sm font-medium"
        >
          {t("apply")}
        </button>
        <Link
          href="/dashboard/branch"
          aria-label={t("refresh")}
          className="grid size-9 place-items-center rounded-md border text-muted-foreground transition-colors hover:bg-accent"
        >
          <RefreshCw className="size-4" />
        </Link>
      </div>
    </FilterBar>
  );
}
