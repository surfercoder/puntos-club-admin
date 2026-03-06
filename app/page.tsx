import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  QrCode,
  Gift,
  Bell,
  BarChart3,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = {
  title: "Puntos Club - Programa de fidelización para tu negocio",
  description: "Crea tu programa de puntos y fideliza a tus clientes con Puntos Club.",
};

export default async function Home() {
  const t = await getTranslations("HomePage");

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Puntos Club
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2">
            <LanguageSwitcher />
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">{t("signIn")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">{t("signUp")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {t("heroDescription")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/owner/onboarding">
                  {t("ctaOwner")}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">{t("ctaSignIn")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              {t("featuresTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              {t("featuresDescription")}
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<QrCode className="size-6" />}
                title={t("featureQrTitle")}
                description={t("featureQrDescription")}
              />
              <FeatureCard
                icon={<Gift className="size-6" />}
                title={t("featureRewardsTitle")}
                description={t("featureRewardsDescription")}
              />
              <FeatureCard
                icon={<Bell className="size-6" />}
                title={t("featureNotificationsTitle")}
                description={t("featureNotificationsDescription")}
              />
              <FeatureCard
                icon={<BarChart3 className="size-6" />}
                title={t("featureDashboardTitle")}
                description={t("featureDashboardDescription")}
              />
              <FeatureCard
                icon={<Store className="size-6" />}
                title={t("featureBranchesTitle")}
                description={t("featureBranchesDescription")}
              />
              <FeatureCard
                icon={<Users className="size-6" />}
                title={t("featureClientsTitle")}
                description={t("featureClientsDescription")}
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm sm:p-12">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("ctaDescription")}
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/owner/onboarding">
                  {t("ctaButton")}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            {t("footerCopyright", { year: new Date().getFullYear() })}
          </p>
          <nav className="flex gap-6">
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("signIn")}
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t("signUp")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
