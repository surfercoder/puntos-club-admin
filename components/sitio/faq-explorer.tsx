"use client";

import Link from "next/link";
import { ChevronDown, CreditCard, Gift, Rocket, Settings, Store, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { SectionTitle, Sparks } from "@/components/sitio/ui";
import { PLAN_LIST_PRICES, PLAN_PRICES } from "@/lib/plans/config";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "plans", icon: Gift, color: "text-sitio-pink", head: "bg-[#ffe1ec]", from: 1, to: 5 },
  { key: "features", icon: Settings, color: "text-[#ffa51a]", head: "bg-[#fff1d4]", from: 6, to: 10 },
  { key: "club", icon: Store, color: "text-[#14b866]", head: "bg-[#dcf6e7]", from: 11, to: 15 },
  { key: "beneficiaries", icon: Users, color: "text-sitio-pink", head: "bg-[#ffe1ec]", from: 16, to: 20 },
  { key: "billing", icon: CreditCard, color: "text-[#ffa51a]", head: "bg-[#fff1d4]", from: 21, to: 24 },
  { key: "other", icon: Rocket, color: "text-[#14b866]", head: "bg-[#dcf6e7]", from: 25, to: 28 },
] as const;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// Los chips del mockup no repiten el color de su categoría.
const CHIP_COLORS = ["text-sitio-pink", "text-[#14b866]", "text-sitio-pink", "text-[#ffa51a]", "text-[#14b866]", "text-sitio-pink"];

export function FaqExplorer() {
  const t = useTranslations("Site.faq");
  const locale = useLocale();
  const ars = (n: unknown) => `$${Number(n).toLocaleString(locale, { useGrouping: "always" })}`;
  // Los precios salen de la misma fuente que cobra Mercado Pago.
  const prices = {
    advance: ars(PLAN_PRICES.advance),
    advanceList: ars(PLAN_LIST_PRICES.advance),
    pro: ars(PLAN_PRICES.pro),
    proList: ars(PLAN_LIST_PRICES.pro),
  };
  const answerTags = {
    plans: (c: React.ReactNode) => (
      <Link href="/planes" className="text-sitio-pink underline">
        {c}
      </Link>
    ),
    demo: (c: React.ReactNode) => (
      <Link href="/contacto" className="text-sitio-pink underline">
        {c}
      </Link>
    ),
  };

  // El chip abre la categoría y deja que el ancla haga el scroll.
  const openCategory = (key: string) => {
    const el = document.getElementById(`faq-${key}`);
    if (el instanceof HTMLDetailsElement) el.open = true;
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-center gap-4">
          <Sparks className="size-10 -scale-x-100" />
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">{t("exploreTitle")}</h2>
          <Sparks className="size-10" />
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ key, icon: Icon }, i) => (
            <li key={key}>
              <a
                href={`#faq-${key}`}
                onClick={() => openCategory(key)}
                className="flex h-full flex-col items-center gap-3 rounded-2xl bg-white/80 px-3 py-5 text-center shadow-[0_10px_24px_-18px_rgba(80,40,90,0.5)] ring-1 ring-[#f3e3ec] transition-transform hover:-translate-y-0.5"
              >
                <Icon className={cn("size-10", CHIP_COLORS[i])} strokeWidth={1.8} />
                <span className="text-[0.95rem]">{t(`categories.${key}`)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-10">
        <SectionTitle className="px-6">{t("listTitle")}</SectionTitle>
        <div className="mt-6 space-y-4">
          {CATEGORIES.map(({ key, icon: Icon, color, head, from, to }, ci) => (
            <details
              key={key}
              id={`faq-${key}`}
              open={ci === 0}
              className="group scroll-mt-28 overflow-hidden rounded-2xl bg-white shadow-[0_10px_24px_-18px_rgba(80,40,90,0.5)] ring-1 ring-[#f1e3ea]"
            >
              <summary className={cn("flex cursor-pointer list-none items-center gap-4 px-6 py-3 [&::-webkit-details-marker]:hidden", head)}>
                <Icon className={cn("size-8 shrink-0", color)} strokeWidth={1.8} />
                <span className="flex-1 text-xl font-extrabold sm:text-2xl">{t(`categories.${key}`)}</span>
                <ChevronDown className="size-6 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="divide-y divide-[#efe6ec] px-6 py-1 sm:px-14">
                {range(from, to).map((n, qi) => (
                  <details key={n} open={ci === 0 && qi === 0} className="group/q py-2.5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.05rem] font-bold [&::-webkit-details-marker]:hidden">
                      {t(`q${n}.q`)}
                      <ChevronDown className="size-5 shrink-0 transition-transform group-open/q:rotate-180" />
                    </summary>
                    <p className="mt-1.5 pr-8 leading-relaxed whitespace-pre-line text-[#2c2c4a]">
                      {t.rich(`q${n}.a`, { ...prices, ...answerTags })}
                    </p>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
