"use server";

import { locales, type Locale } from "@/i18n/locales";
import { setLocaleCookie } from "@/i18n/set-locale-cookie";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;

  await setLocaleCookie(locale);
}
