import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";

export type BeneficiaryFilterValues = {
  q: string;
  status: string;
  points: string;
  from: string;
};

export async function BeneficiaryFilters({
  values,
  namesOnly = false,
}: {
  values: BeneficiaryFilterValues;
  /** Los owners solo buscan por nombre: no ven email ni documento. */
  namesOnly?: boolean;
}) {
  const t = await getTranslations("Dashboard.beneficiary.filters");

  return (
    <FilterBar className="md:grid-cols-[1.6fr_1fr_1.1fr_1.2fr_auto]">
      <FilterSearch
        label={t("search")}
        placeholder={t(namesOnly ? "searchPlaceholderName" : "searchPlaceholder")}
        defaultValue={values.q}
      />

      <FilterField label={t("status")}>
        <select className={FILTER_FIELD_CLASS} name="status" defaultValue={values.status}>
          <option value="">{t("all")}</option>
          <option value="active">{t("statusActive")}</option>
          <option value="inactive">{t("statusInactive")}</option>
        </select>
      </FilterField>

      <FilterField label={t("points")}>
        <select className={FILTER_FIELD_CLASS} name="points" defaultValue={values.points}>
          <option value="">{t("all")}</option>
          <option value="with">{t("pointsWith")}</option>
          <option value="without">{t("pointsWithout")}</option>
        </select>
      </FilterField>

      <FilterField label={t("registrationDate")}>
        <span className="relative">
          <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${FILTER_FIELD_CLASS} pl-9`}
            type="date"
            name="from"
            defaultValue={values.from}
            aria-label={t("registrationDate")}
          />
        </span>
      </FilterField>

      <FilterActions
        applyLabel={t("apply")}
        clearLabel={t("clear")}
        clearHref="/dashboard/beneficiary"
      />
    </FilterBar>
  );
}
