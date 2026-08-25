import { getTranslations } from "next-intl/server";

import {
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";

export type StaffFilterValues = {
  q: string;
  status: string;
  branch: string;
};

export async function StaffFilters({
  values,
  branches,
  basePath,
  showBranch,
}: {
  values: StaffFilterValues;
  branches: { id: string; name: string }[];
  basePath: string;
  showBranch: boolean;
}) {
  const t = await getTranslations("Dashboard.staff.filters");

  return (
    <FilterBar className={showBranch ? "md:grid-cols-[2fr_1fr_1fr_auto]" : "md:grid-cols-[2fr_1fr_auto]"}>
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

      {showBranch && (
        <FilterField label={t("branch")}>
          <select className={FILTER_FIELD_CLASS} name="branch" defaultValue={values.branch}>
            <option value="">{t("allFemale")}</option>
            <option value="none">{t("branchNone")}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </FilterField>
      )}

      <FilterActions applyLabel={t("apply")} clearLabel={t("clear")} clearHref={basePath} />
    </FilterBar>
  );
}
