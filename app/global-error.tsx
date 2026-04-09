"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect, useState } from "react";

import { defaultLocale, locales, type Locale } from "@/i18n/locales";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const value = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/)?.[1];
  return value && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    Sentry.captureException(error);
    setLocale(readLocaleCookie());
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
