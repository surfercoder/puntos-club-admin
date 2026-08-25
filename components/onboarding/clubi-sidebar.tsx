"use client";

import { Lightbulb, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Clubi } from "@/components/dashboard/home/clubi";

/** Pasos que muestran un consejo de Clubi además del mensaje principal. */
const STEPS_WITH_TIP = new Set([2, 3, 4]);

export function ClubiSidebar({ step }: { step: number }) {
  const t = useTranslations("Onboarding.clubi");

  return (
    <aside className="space-y-4">
      <div className="flex justify-center">
        <Clubi accent="#FF4573" className="h-40 w-36" />
      </div>

      <div className="rounded-xl bg-brand-pink/5 p-5">
        <p className="text-base font-semibold text-brand-pink">{t("greeting")}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t(`messages.step${step}`)}
        </p>
      </div>

      {STEPS_WITH_TIP.has(step) && (
        <div className="rounded-xl bg-brand-pink/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-brand-orange" />
            {t("tipTitle")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t(`tips.step${step}`)}
          </p>
        </div>
      )}

      <div className="rounded-xl bg-brand-blue/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-brand-blue" />
          {t("safeTitle")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("safeBody")}</p>
      </div>
    </aside>
  );
}
