import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function PublicHeader() {
  const t = await getTranslations("HomePage");

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span>Puntos</span>
          <span className="text-brand-pink">Club</span>
        </Link>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">{t("signIn")}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/owner/onboarding">{t("join")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
