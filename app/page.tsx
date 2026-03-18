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
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export default async function Home() {
  const t = await getTranslations("HomePage");

  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />

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

      <PublicFooter />
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
