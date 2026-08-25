"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyableCode({ value }: { value: string }) {
  const t = useTranslations("Common");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El navegador puede bloquear el portapapeles; no rompemos la fila por eso.
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono font-medium text-brand-violet">{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={t("copy")}
        className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-brand-green" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  );
}
