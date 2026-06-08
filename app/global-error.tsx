"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect, useState } from "react";

import type { Locale } from "@/i18n/locales";

import { readLocaleCookie } from "./read-locale-cookie";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const [locale] = useState<Locale>(() => readLocaleCookie());

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
