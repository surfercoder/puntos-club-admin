import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { FilterOption } from "@/components/dashboard/purchase/purchase-filters";
import {
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";
import { REDEMPTION_STATUSES } from "@/lib/utils";

export type RedemptionFilterValues = {
  q: string;
  status: string;
  from: string;
  to: string;
  beneficiary: string;
  product: string;
};

export async function RedemptionFilters({
  values,
  beneficiaries,
  products,
}: {
  values: RedemptionFilterValues;
  beneficiaries: FilterOption[];
  products: FilterOption[];
}) {
  const t = await getTranslations("Dashboard.redemption.filters");
  const tStatus = await getTranslations("Dashboard.redemption.status");

  return (
    <FilterBar className="md:grid-cols-4">
      <FilterSearch
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        defaultValue={values.q}
      />

      <FilterField label={t("status")}>
        <select className={FILTER_FIELD_CLASS} name="status" defaultValue={values.status}>
          <option value="">{t("allStatuses")}</option>
          {REDEMPTION_STATUSES.map((status) => (
            <option key={status} value={status}>{tStatus(status)}</option>
          ))}
        </select>
      </FilterField>

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

      <FilterField label={t("beneficiary")}>
        <select
          className={FILTER_FIELD_CLASS}
          name="beneficiary"
          defaultValue={values.beneficiary}
        >
          <option value="">{t("allBeneficiaries")}</option>
          {beneficiaries.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </FilterField>

      <FilterField label={t("product")}>
        <select className={FILTER_FIELD_CLASS} name="product" defaultValue={values.product}>
          <option value="">{t("allProducts")}</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </FilterField>

      <FilterActions
        applyLabel={t("apply")}
        clearLabel={t("clear")}
        clearHref="/dashboard/redemption"
      />
    </FilterBar>
  );
}
