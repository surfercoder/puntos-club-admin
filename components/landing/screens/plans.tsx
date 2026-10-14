"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PlanCards, type PlanLimitsByPlan } from "@/components/plan/plan-cards";
import { LS_PLAN } from "@/lib/onboarding-storage";
import type { PlanType } from "@/types/plan";

export default function Plans({ limits }: { limits: PlanLimitsByPlan }) {
  const t = useTranslations("Landing.plans");
  const router = useRouter();

  // El paso 3 del onboarding lee LS_PLAN: el plan elegido acá llega preseleccionado.
  const handleSelect = (plan: PlanType) => {
    try {
      localStorage.setItem(LS_PLAN, plan);
    } catch {
      // Sin storage el onboarding arranca en Trial, que es el default.
    }
    router.push("/owner/onboarding");
  };

  return (
    <section id="planes" className="flex w-full max-w-6xl flex-col items-center px-4 py-16">
      <h2 className="w-fit border border-t-0 border-solid border-opacity-10 rounded-xl rounded-t-none py-5 px-6 text-2xl font-semibold md:text-3xl lg:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-6 mb-10 max-w-2xl text-center text-base text-muted-foreground md:text-lg">
        {t("subtitle")}
      </p>
      <div className="w-full">
        <PlanCards limits={limits} selected={null} onSelect={handleSelect} />
      </div>
    </section>
  );
}
