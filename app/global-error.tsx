"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect, useState } from "react";

import { defaultLocale, type Locale } from "@/i18n/locales";

import { readLocaleCookie } from "./read-locale-cookie";

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
