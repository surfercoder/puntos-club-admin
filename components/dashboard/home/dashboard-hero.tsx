"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { GiftIllustration } from "@/components/dashboard/home/gift-illustration";
import {
  DASHBOARD_RANGES,
  type DashboardRange,
} from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardHero({
  firstName,
  organizationName,
  range,
}: {
  firstName: string;
  organizationName: string;
  range: DashboardRange;
}) {
  const t = useTranslations("Dashboard.home");
  const router = useRouter();

  // Igual que en TablePagination: la URL se lee al cambiar el período, no en
  // render, así el hero no necesita un <Suspense> alrededor.
  const onRangeChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("range", value);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-bold tracking-tight sm:text-[2.15rem]">
          {t("greeting", { name: firstName })}{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle", { organization: organizationName })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <GiftIllustration className="hidden h-24 w-32 shrink-0 lg:block" />
        <Select value={String(range)} onValueChange={onRangeChange}>
          <SelectTrigger
            className="h-10 w-[190px] bg-card"
            aria-label={t("rangeLabel")}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_RANGES.map((months) => (
              <SelectItem key={months} value={String(months)}>
                {t("rangeOption", { months })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
