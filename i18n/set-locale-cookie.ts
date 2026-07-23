import { cookies } from "next/headers";

import type { Locale } from "@/i18n/locales";

/**
 * Persists the user's locale preference cookie. Kept in the i18n layer so the
 * server action stays a thin, side-effect-free wrapper.
 */
export async function setLocaleCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
