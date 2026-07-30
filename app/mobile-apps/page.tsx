import { Smartphone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { AppDownloadQRCards } from "@/components/mobile-apps/app-download-qr-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("mobileAppsTitle"),
    description: t("mobileAppsDescription"),
  };
}

export default async function MobileAppsPage() {
  const t = await getTranslations("MobileApps");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Smartphone className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AppDownloadQRCards />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t("androidOnly")}
      </p>
    </div>
  );
}
