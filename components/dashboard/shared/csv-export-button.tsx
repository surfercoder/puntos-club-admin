"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { toCsv } from "@/lib/utils";


export function CsvExportButton({
  filename,
  headers,
  rows,
  label,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  label?: string;
}) {
  const t = useTranslations("Common");

  const download = () => {
    // El BOM hace que Excel abra los acentos correctamente.
    const blob = new Blob(["﻿", toCsv(headers, rows)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Download className="size-4" />
      {label ?? t("export")}
    </button>
  );
}
