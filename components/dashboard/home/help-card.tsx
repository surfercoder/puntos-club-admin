"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Clubi } from "@/components/dashboard/home/clubi";
import { START_TOUR_EVENT } from "@/components/dashboard/tour/dashboard-tour";

export function HelpCard() {
  const t = useTranslations("Dashboard.home.help");

  return (
    <section className="relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7C3AED_0%,#A855F7_55%,#D946A6_100%)] p-5 text-white shadow-sm">
      <div className="relative z-10 max-w-[62%]">
        <h2 className="text-base font-semibold">{t("title")}</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/85">
          {t("description")}
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent(START_TOUR_EVENT))}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#7C3AED] transition-colors hover:bg-white/90"
        >
          {t("cta")}
          <ArrowRight className="size-4" />
        </button>
      </div>
      <Clubi
        accent="#FF4573"
        className="pointer-events-none absolute -right-2 bottom-0 h-[124px] w-[112px]"
      />
    </section>
  );
}
