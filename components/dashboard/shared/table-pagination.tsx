"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PER_PAGE_OPTIONS } from "@/lib/utils";

export function TablePagination({
  total,
  page,
  perPage,
}: {
  total: number;
  page: number;
  perPage: number;
}) {
  const t = useTranslations("Common.pagination");
  const router = useRouter();

  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  // La URL se lee acá y no con useSearchParams/usePathname: sólo hace falta al
  // navegar, y leerla en render obliga a envolver cada tabla en <Suspense>.
  const go = (next: Record<string, string>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  const buttons = [
    { key: "first", icon: ChevronsLeft, target: 1, disabled: page <= 1 },
    { key: "previous", icon: ChevronLeft, target: page - 1, disabled: page <= 1 },
    { key: "next", icon: ChevronRight, target: page + 1, disabled: page >= totalPages },
    { key: "last", icon: ChevronsRight, target: totalPages, disabled: page >= totalPages },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 border-t px-4 py-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{t("rowsPerPage")}</span>
        <Select
          value={String(perPage)}
          onValueChange={(value) => go({ perPage: value, page: "1" })}
        >
          <SelectTrigger className="h-8 w-[78px]" aria-label={t("rowsPerPage")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PER_PAGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className="text-muted-foreground">
        {t("pageOf", { page, totalPages })}
      </span>

      <div className="flex items-center gap-1">
        {buttons.slice(0, 2).map(({ key, icon: Icon, target, disabled }) => (
          <PageButton
            key={key}
            label={t(key)}
            icon={Icon}
            disabled={disabled}
            onClick={() => go({ page: String(target) })}
          />
        ))}
        <span className="grid size-8 place-items-center rounded-md border border-brand-violet/40 text-sm font-medium text-brand-violet">
          {page}
        </span>
        {buttons.slice(2).map(({ key, icon: Icon, target, disabled }) => (
          <PageButton
            key={key}
            label={t(key)}
            icon={Icon}
            disabled={disabled}
            onClick={() => go({ page: String(target) })}
          />
        ))}
      </div>
    </div>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="size-4" />
    </button>
  );
}
