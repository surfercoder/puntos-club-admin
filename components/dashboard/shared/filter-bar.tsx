import { Search } from "lucide-react";
import Link from "next/link";

export const FILTER_FIELD_CLASS =
  "border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      method="GET"
      className={`grid items-end gap-3 rounded-xl border bg-card p-4 shadow-sm ${className ?? ""}`}
    >
      {children}
    </form>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 whitespace-nowrap text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

/** Campo de búsqueda con lupa: idéntico en las seis listas, sólo cambia el placeholder. */
export function FilterSearch({
  label,
  placeholder,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <FilterField label={label}>
      <span className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className={`${FILTER_FIELD_CLASS} pl-9`}
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
        />
      </span>
    </FilterField>
  );
}

export function FilterActions({
  applyLabel,
  clearLabel,
  clearHref,
}: {
  applyLabel: string;
  clearLabel: string;
  clearHref: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="submit"
        className="brand-cta h-9 cursor-pointer whitespace-nowrap rounded-md px-4 text-sm font-medium"
      >
        {applyLabel}
      </button>
      <Link
        href={clearHref}
        className="h-9 whitespace-nowrap rounded-md px-3 text-sm font-medium leading-9 text-brand-violet transition-colors hover:bg-accent"
      >
        {clearLabel}
      </Link>
    </div>
  );
}
