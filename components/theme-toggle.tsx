"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("Common");

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={toggleTheme}
      aria-label={t("toggleTheme")}
    >
      <Sun className="size-[1.1rem] rotate-0 opacity-100 transition-[transform,opacity] dark:-rotate-90 dark:opacity-0" />
      <Moon className="absolute size-[1.1rem] rotate-90 opacity-0 transition-[transform,opacity] dark:rotate-0 dark:opacity-100" />
      <span className="sr-only">{t("toggleTheme")}</span>
    </Button>
  );
}
