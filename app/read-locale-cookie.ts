import { defaultLocale, locales, type Locale } from "@/i18n/locales";

export function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const value = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/)?.[1];
  return value && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}
