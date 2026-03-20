import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingApp } from "@/components/landing/landing-app";
import { PublicHeader } from "@/components/public-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export default function Home() {
  return (
    <>
      <PublicHeader />
      <LandingApp />
    </>
  );
}
