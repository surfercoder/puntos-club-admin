"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import writeXlsxFile from "write-excel-file/browser";

export function ExcelExportButton({
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

  const download = () =>
    writeXlsxFile([headers.map((value) => ({ value, fontWeight: "bold" as const })), ...rows], {
      stickyRowsCount: 1,
      // Ancho por columna segun el contenido mas largo, para que no salga cortado.
      columns: headers.map((header, column) => ({
        width: Math.min(
          50,
          rows.reduce((max, row) => Math.max(max, String(row[column] ?? "").length), header.length) + 2,
        ),
      })),
    }).toFile(filename);

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
