"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocale } from "@/actions/i18n/set-locale";
import { locales, type Locale } from "@/i18n/locales";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  es: { flag: "🇦🇷", label: "Español" },
  en: { flag: "🇺🇸", label: "English" },
};

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    startTransition(async () => {
      await setLocale(newLocale as Locale);
      router.refresh();
    });
  };

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        size="sm"
        className="h-8 w-auto gap-1.5 border-none bg-transparent shadow-none focus-visible:ring-0 px-2 hover:bg-accent hover:text-accent-foreground"
        aria-label={t("label")}
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span className="text-base leading-none">{LOCALE_META[locale]?.flag}</span>
            <span className="text-xs font-medium uppercase tracking-wide">{locale}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[130px]">
        {locales.map((l) => (
          <SelectItem key={l} value={l} className="cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{LOCALE_META[l]?.flag}</span>
              <span>{t(l)}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
