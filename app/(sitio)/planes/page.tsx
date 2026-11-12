import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PlansTable } from "@/components/sitio/plans-table";
import { Blob } from "@/components/sitio/ui";
import { getPublicPlanLimits } from "@/lib/plans/public-limits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("plansTitle"), description: t("plansDescription"), alternates: { canonical: "/planes" } };
}

export default async function PlanesPage() {
  const limits = await getPublicPlanLimits();
  // Sin plan_limits no hay nada que mostrar: mejor un 404 que una tabla en cero.
  if (!limits) notFound();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <Blob className="top-0 -left-20 h-80 w-80 bg-[#d6e8ff]/80" />
      <Blob className="top-20 right-0 h-96 w-[30rem] bg-[#ffd3e5]/70" />
      <h1 className="sr-only">{(await getTranslations("Site.nav"))("plans")}</h1>
      <PlansTable limits={limits} />
    </section>
  );
}
