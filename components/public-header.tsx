import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function PublicHeader() {
  const t = await getTranslations("HomePage");

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-20 max-w-[96rem] items-center justify-between gap-4 px-4 sm:px-6 lg:h-32 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 lg:gap-3.5">
          <Image
            src="/images/logos/LogoImage.png"
            alt=""
            width={318}
            height={318}
            priority
            className="size-11 lg:size-[4.875rem]"
          />
          <span className="font-sans text-xl font-bold tracking-tight whitespace-nowrap sm:text-2xl lg:text-[2.375rem]">
            Puntos <span className="text-brand-pink">Club</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 lg:gap-4">
          <LanguageSwitcher className="hidden sm:flex lg:h-10 lg:px-3 lg:[&_span]:text-base" />
          <ThemeToggle className="lg:size-11" iconClassName="lg:size-8" />
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-border sm:block lg:mx-6 lg:h-9" />
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex lg:h-10 lg:px-4 lg:text-[1.1875rem]" asChild>
            <Link href="/auth/login">{t("signIn")}</Link>
          </Button>
          <Button
            size="sm"
            className="lg:ml-2 lg:h-[3.1875rem] lg:rounded-[0.625rem] lg:px-7 lg:text-lg lg:font-bold"
            asChild
          >
            <Link href="/owner/onboarding">{t("join")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
