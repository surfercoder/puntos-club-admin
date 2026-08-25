import type { PushNotificationStatus } from "@/types/push_notification";
import type { RedemptionStatus } from "@/types/redemption";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function formatDateTime(
  value: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleString(locale, options);
}

export function formatDateOnly(
  value: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleDateString(locale, options);
}

// `/dashboard/beneficiary/create` sigue marcando "Beneficiarios"; `/dashboard`
// solo se marca a sí mismo (si no, quedaría activo en todas las rutas).
export function isNavItemActive(pathname: string | null, url: string): boolean {
  if (!pathname) return false;
  if (url === "/dashboard") return pathname === "/dashboard";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export const DASHBOARD_RANGES = [3, 6, 12] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

/** Meses del selector de período del dashboard; 6 es el valor por defecto. */
export function parseDashboardRange(value: string | undefined): DashboardRange {
  const months = Number(value);
  return (DASHBOARD_RANGES as readonly number[]).includes(months)
    ? (months as DashboardRange)
    : 6;
}

export const PER_PAGE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 10;

export function parsePerPage(value: string | undefined): number {
  const perPage = Number(value);
  return (PER_PAGE_OPTIONS as readonly number[]).includes(perPage)
    ? perPage
    : DEFAULT_PER_PAGE;
}

/** Página 1-based, acotada al total de páginas disponible. */
export function parsePage(value: string | undefined, totalPages: number): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, Math.max(totalPages, 1));
}

/**
 * Código legible de canje. La tabla no guarda un número propio, así que lo
 * derivamos del id y del año para que sea estable y ordenable.
 */
export function redemptionCode(id: string | number, date: string): string {
  const year = new Date(date).getUTCFullYear();
  return `CAN-${year}-${String(id).padStart(6, "0")}`;
}

export const MOTHER_RULE_TYPES = ["percentage", "fixed_amount"] as const;
export type MotherRuleType = (typeof MOTHER_RULE_TYPES)[number];

/** Puntos que otorgaría una compra de `amount` con la configuración indicada. */
export function previewPoints(
  type: MotherRuleType,
  value: number,
  amount: number,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (type === "percentage") return (amount * value) / 100;
  return (amount / 100) * value;
}

// Estilos compartidos por las pantallas de auth. Viven acá y no en
// `login-form.tsx` porque ese módulo arrastra los server actions (y con ellos
// `lib/env`) a cualquiera que sólo quiera las clases.
export const INPUT_CLASS =
  "h-[3.875rem] rounded-[0.875rem] border-[1.5px] border-brand-pink/25 bg-transparent px-6 text-lg shadow-none md:text-lg lg:text-[1.1875rem]";

export const AUTH_CARD_CLASS =
  "w-full rounded-[2rem] bg-card px-8 py-10 shadow-[0_4px_12px_-2px_rgba(26,26,46,0.14)] sm:px-[4.75rem] sm:pt-14 sm:pb-[3.25rem]";

export const AUTH_SUBMIT_CLASS =
  "h-[3.875rem] w-full rounded-xl text-lg font-semibold sm:text-[1.1875rem]";

// Opciones de los filtros de las listas. Viven acá, junto a PER_PAGE_OPTIONS y
// DASHBOARD_RANGES, para que las páginas server no tengan que importar el
// componente de filtros sólo por su lista de valores.
export const NOTIFICATION_STATUSES: PushNotificationStatus[] = [
  "draft",
  "sending",
  "sent",
  "failed",
];

export const REDEMPTION_STATUSES: RedemptionStatus[] = ["pending", "delivered", "cancelled"];

export const CAMPAIGN_TABS = ["active", "scheduled", "finished"] as const;
export type CampaignTab = (typeof CAMPAIGN_TABS)[number];

export const POINT_RANGES = [
  { key: "0-1000", min: 0, max: 1000 },
  { key: "1000-5000", min: 1000, max: 5000 },
  { key: "5000-10000", min: 5000, max: 10000 },
  { key: "10000+", min: 10000, max: Number.POSITIVE_INFINITY },
] as const;

/**
 * Escapa un valor para CSV: comillas dobles y separador quedan dentro del campo.
 *
 * Un valor que arranca con =, +, -, @, tab o CR lo interpretan como fórmula
 * Excel y Sheets al abrir el archivo. Los nombres y comentarios los escribe el
 * beneficiario, así que se les antepone una comilla simple para que viajen como
 * texto.
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const escape = (value: string | number | null | undefined) => {
    const text = String(value ?? "");
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}
