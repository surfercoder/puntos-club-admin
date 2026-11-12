import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Bell, ChartNoAxesColumn, Gift, Megaphone, Palette, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/sitio/cta-band";
import { HeroDashboard } from "@/components/sitio/hero-dashboard";
import { Blob, Cta, Pill, SectionTitle, Sparks } from "@/components/sitio/ui";
import { DEMO_HREF, rich } from "@/components/sitio/rich";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("howTitle"), description: t("howDescription"), alternates: { canonical: "/como-funciona" } };
}

const STEPS = [
  { key: "step1", img: "paso-laptop", w: 156, h: 103, card: "bg-[#ffe8f0]", num: "bg-sitio-pink" },
  { key: "step2", img: "paso-monedas", w: 124, h: 94, card: "bg-[#e3f7ec]", num: "bg-[#14b866]" },
  { key: "step3", img: "paso-personas", w: 148, h: 123, card: "bg-[#fff4d9]", num: "bg-[#ffb21a]" },
  { key: "step4", img: "paso-cohete", w: 109, h: 105, card: "bg-[#e6f1ff]", num: "bg-[#14b866]" },
] as const;

const TOOLS = [
  { key: "tool1", icon: Gift },
  { key: "tool2", icon: Users },
  { key: "tool3", icon: ChartNoAxesColumn },
  { key: "tool4", icon: Megaphone },
  { key: "tool5", icon: Palette, pro: true },
  { key: "tool6", icon: Bell },
] as const;

export default async function ComoFuncionaPage() {
  const t = await getTranslations("Site.how");

  return (
    <>
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <Blob className="top-0 right-0 h-96 w-[36rem] bg-[#ffd3e5]/70" />
        <div>
          <Pill>{t("pill")}</Pill>
          <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {t.rich("title", rich)}
          </h1>
          <p className="mt-4 max-w-md text-lg leading-snug lg:text-xl">{t("subtitle")}</p>
          <Cta href={DEMO_HREF} className="mt-7 h-14 px-9 text-xl">
            {t("cta")}
          </Cta>
        </div>
        <HeroDashboard />
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <Blob className="top-10 left-0 h-80 w-80 bg-[#fff0c2]/70" />
        <Blob className="top-0 right-0 h-80 w-80 bg-[#d6f5e3]/80" />
        <div className="flex items-center justify-center gap-5">
          <span aria-hidden className="hidden h-1 w-10 rounded-full bg-[#14b866] sm:block" />
          <SectionTitle className="text-center">{t.rich("stepsTitle", rich)}</SectionTitle>
          <span aria-hidden className="hidden h-1 w-10 rounded-full bg-[#14b866] sm:block" />
        </div>
        <p className="mt-3 text-center text-lg lg:text-xl">{t("stepsSubtitle")}</p>

        <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map(({ key, img, w, h, card, num }, i) => (
            <li key={key} className={cn("relative rounded-3xl px-6 pt-12 pb-8 shadow-[0_14px_34px_-22px_rgba(80,40,90,0.4)] ring-1 ring-white", card)}>
              <span className={cn("absolute -top-6 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-md", num)}>
                {i + 1}
              </span>
              <div className="flex h-28 items-center justify-center">
                <Image src={`/images/sitio/${img}.png`} alt="" width={w} height={h} className="h-28 w-auto object-contain" />
              </div>
              <h3 className="mt-6 text-[1.6rem] leading-[1.1] font-extrabold tracking-tight">{t(`${key}Title`)}</h3>
              <p className="mt-3 text-[0.95rem] leading-snug text-[#3f3f5e]">{t(`${key}Text`)}</p>
              {i < STEPS.length - 1 && (
                <span className="absolute top-1/2 -right-6 z-10 hidden size-9 items-center justify-center rounded-full bg-[#14b866] text-white lg:flex">
                  <ArrowRight className="size-5" strokeWidth={2.5} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-8 sm:px-6 md:grid-cols-[0.45fr_1fr] lg:px-10">
        <div className="relative mx-auto w-56 md:w-full md:max-w-xs">
          <Sparks className="absolute top-0 right-0 size-14" />
          <Image src="/images/sitio/clubi-puno.png" alt="Clubi" width={294} height={296} className="w-full" />
        </div>
        <div>
          <SectionTitle>{t.rich("toolsTitle", rich)}</SectionTitle>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(({ key, icon: Icon, ...rest }) => (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-4 rounded-2xl px-5 py-4 text-[0.95rem] leading-snug font-medium shadow-[0_10px_24px_-18px_rgba(80,40,90,0.5)] ring-1",
                  "pro" in rest ? "bg-[#e3f7ec] ring-[#c9eed8]" : "bg-white ring-[#f3e3ec]"
                )}
              >
                <Icon className={cn("size-9 shrink-0", "pro" in rest ? "text-[#14b866]" : "text-sitio-pink")} strokeWidth={1.8} />
                <span>{t.rich(key, rich)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        className="lg:pr-80"
        art={
          <div className="relative mx-auto w-48 lg:absolute lg:right-14 lg:bottom-0 lg:w-56">
            <Sparks className="absolute top-2 -left-10 size-12 -scale-x-100" />
            <Image src="/images/sitio/clubi-asoma.png" alt="" width={202} height={210} className="w-full" />
          </div>
        }
      >
        <div className="lg:max-w-md">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight lg:text-[2.4rem]">{t.rich("ctaTitle", rich)}</h2>
          <p className="mt-3 text-lg leading-snug">{t("ctaText")}</p>
        </div>
        <Cta href={DEMO_HREF} variant="pink" className="h-14 self-start px-8 text-xl lg:self-center">
          {t("cta")}
        </Cta>
      </CtaBand>
    </>
  );
}
