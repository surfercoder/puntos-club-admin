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
