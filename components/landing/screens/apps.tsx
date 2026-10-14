"use client";

import { useTranslations } from "next-intl";
import { AppDownloadQRCards } from "@/components/mobile-apps/app-download-qr-cards";

export default function Apps() {
  const t = useTranslations("Landing.apps");

  return (
    <section id="apps" className="flex w-full max-w-4xl flex-col items-center px-4 py-16">
      <h2 className="w-fit border border-t-0 border-solid border-opacity-10 rounded-xl rounded-t-none py-5 px-6 text-2xl font-semibold md:text-3xl lg:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-6 mb-10 max-w-2xl text-center text-base text-muted-foreground md:text-lg">
        {t("subtitle")}
      </p>
      <div className="w-full">
        <AppDownloadQRCards />
      </div>
    </section>
  );
}
