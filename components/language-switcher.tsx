"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocale } from "@/actions/i18n/set-locale";
import { locales, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_CODE: Record<Locale, string> = {
  es: "AR ES",
  en: "US EN",
};

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as Locale;
  const { refresh } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocale(newLocale as Locale);
      refresh();
    });
  };

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-8 w-auto gap-1.5 border-none bg-transparent px-2 shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-0 dark:bg-transparent dark:hover:bg-accent",
          className,
        )}
        aria-label={t("label")}
      >
        <SelectValue>
          <span className="text-xs font-medium tracking-wide uppercase">
            {LOCALE_CODE[locale] ?? locale}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[130px]">
        {locales.map((l) => (
          <SelectItem key={l} value={l} className="cursor-pointer">
            {t(l)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
