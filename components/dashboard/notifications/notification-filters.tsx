import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  FILTER_FIELD_CLASS,
  FilterActions,
  FilterBar,
  FilterField,
  FilterSearch,
} from "@/components/dashboard/shared/filter-bar";
import { NOTIFICATION_STATUSES } from "@/lib/utils";

export type NotificationFilterValues = {
  q: string;
  status: string;
  from: string;
  to: string;
};

export async function NotificationFilters({
  values,
}: {
  values: NotificationFilterValues;
}) {
  const t = await getTranslations("Dashboard.notifications.filters");
  const tStatus = await getTranslations("Dashboard.notifications.status");

  return (
    <FilterBar className="md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <FilterSearch
        label={t("search")}
        placeholder={t("searchPlaceholder")}
        defaultValue={values.q}
      />

      <FilterField label={t("status")}>
        <select className={FILTER_FIELD_CLASS} name="status" defaultValue={values.status}>
          <option value="">{t("all")}</option>
          {NOTIFICATION_STATUSES.map((status) => (
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

      <FilterActions
        applyLabel={t("apply")}
        clearLabel={t("clear")}
        clearHref="/dashboard/notifications"
      />
    </FilterBar>
  );
}
