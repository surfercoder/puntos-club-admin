import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";
import { POINT_RANGES } from "@/lib/utils";

export type PurchaseFilterValues = {
  q: string;
  from: string;
  to: string;
  branch: string;
  cashier: string;
  beneficiary: string;
  type: string;
  points: string;
};

export type FilterOption = { id: string; name: string };


export async function PurchaseFilters({
  values,
  branches,
  cashiers,
  beneficiaries,
}: {
  values: PurchaseFilterValues;
  branches: FilterOption[];
  cashiers: FilterOption[];
  beneficiaries: FilterOption[];
}) {
  const t = await getTranslations("Dashboard.purchase.filters");
  const tTypes = await getTranslations("Dashboard.purchase.types");

  return (
    <FilterBar className="md:grid-cols-4 xl:grid-cols-5">
      <FilterSearch
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        defaultValue={values.q}
      />

      <FilterField label={t("from")}>
        <span className="relative">
          <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${FILTER_FIELD_CLASS} pl-9`}
            type="date"
            name="from"
            defaultValue={values.from}
            aria-label={t("from")}
          />
        </span>
      </FilterField>

      <FilterField label={t("to")}>
        <span className="relative">
          <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${FILTER_FIELD_CLASS} pl-9`}
            type="date"
            name="to"
            defaultValue={values.to}
            aria-label={t("to")}
          />
        </span>
      </FilterField>

      <FilterField label={t("branch")}>
        <select className={FILTER_FIELD_CLASS} name="branch" defaultValue={values.branch}>
          <option value="">{t("allFemale")}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </FilterField>

      <FilterField label={t("cashier")}>
        <select className={FILTER_FIELD_CLASS} name="cashier" defaultValue={values.cashier}>
          <option value="">{t("all")}</option>
          {cashiers.map((cashier) => (
            <option key={cashier.id} value={cashier.id}>{cashier.name}</option>
          ))}
        </select>
      </FilterField>

      <FilterField label={t("beneficiary")}>
        <select
          className={FILTER_FIELD_CLASS}
          name="beneficiary"
          defaultValue={values.beneficiary}
        >
          <option value="">{t("all")}</option>
          {beneficiaries.map((beneficiary) => (
            <option key={beneficiary.id} value={beneficiary.id}>{beneficiary.name}</option>
          ))}
        </select>
      </FilterField>

      <FilterField label={t("type")}>
        <select className={FILTER_FIELD_CLASS} name="type" defaultValue={values.type}>
          <option value="">{t("allFemale")}</option>
          <option value="sale">{tTypes("sale")}</option>
          <option value="assignment">{tTypes("assignment")}</option>
        </select>
      </FilterField>

      <FilterField label={t("points")}>
        <select className={FILTER_FIELD_CLASS} name="points" defaultValue={values.points}>
          <option value="">{t("all")}</option>
          {POINT_RANGES.map((range) => (
            <option key={range.key} value={range.key}>
              {t(`pointRanges.${range.key}`)}
            </option>
          ))}
        </select>
      </FilterField>

      <FilterActions
        applyLabel={t("apply")}
        clearLabel={t("clear")}
        clearHref="/dashboard/purchase"
      />
    </FilterBar>
  );
}
