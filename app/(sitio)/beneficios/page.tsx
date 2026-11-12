import type { Metadata } from "next";
import Image from "next/image";
import { ChartNoAxesColumn, Check, Laptop, ShoppingCart, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/sitio/cta-band";
import { Blob, Cta, Pill, SectionTitle, Sparks } from "@/components/sitio/ui";
import { DEMO_HREF, rich } from "@/components/sitio/rich";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("benefitsTitle"), description: t("benefitsDescription"), alternates: { canonical: "/beneficios" } };
}

const CARDS = [
  { key: "card1", icon: ChartNoAxesColumn, card: "bg-[#ffeef4] ring-[#fbdbe7]", box: "bg-[#ffdbe8] text-sitio-pink" },
  { key: "card2", icon: Users, card: "bg-[#eaf9f0] ring-[#cfeedd]", box: "bg-[#d3f3e1] text-[#18b866]", fill: true },
  { key: "card3", icon: ShoppingCart, card: "bg-[#fff6e3] ring-[#fbe9c4]", box: "bg-[#ffeccb] text-[#ffa51a]" },
  { key: "card4", icon: Laptop, card: "bg-[#ebf3ff] ring-[#d5e6fb]", box: "bg-[#d9e9ff] text-sitio-blue" },
] as const;

const WHY = ["why1", "why2", "why3", "why4", "why5"] as const;

export default async function BeneficiosPage() {
  const t = await getTranslations("Site.benefits");

  return (
    <>
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-2 lg:px-10">
        <Blob className="top-0 right-0 h-96 w-[34rem] bg-[#ffd3e5]/70" />
        <div>
          <Pill>{t("pill")}</Pill>
          <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {t.rich("title", rich)}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-snug lg:text-xl">{t("subtitle")}</p>
          <Cta href={DEMO_HREF} className="mt-7 h-14 px-9 text-xl">
            {t("cta")}
          </Cta>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <Sparks className="absolute top-10 left-0 size-14" />
          <Image src="/images/sitio/hero-crecimiento.png" alt="Clubi" width={507} height={341} priority className="w-full" />
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <Blob className="top-0 left-0 h-72 w-72 bg-[#fff0c2]/70" />
        <div className="relative mx-auto w-fit">
          <SectionTitle className="text-center">{t.rich("mainTitle", rich)}</SectionTitle>
          <Sparks className="absolute -top-6 -right-12 size-12 rotate-12" />
        </div>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {CARDS.map(({ key, icon: Icon, card, box, ...rest }) => (
            <li key={key} className={cn("relative flex gap-6 rounded-3xl p-6 shadow-[0_14px_34px_-24px_rgba(80,40,90,0.4)] ring-1", card)}>
              <span className={cn("flex size-24 shrink-0 items-center justify-center rounded-2xl", box)}>
                <Icon className={cn("size-14", "fill" in rest && "fill-current")} strokeWidth={2.4} />
              </span>
              <div className="pr-8">
                <h3 className="text-[1.65rem] leading-[1.1] font-extrabold tracking-tight">{t(`${key}Title`)}</h3>
                <p className="mt-2 leading-snug text-[#3f3f5e]">{t(`${key}Text`)}</p>
              </div>
              <Sparks className="absolute top-4 right-6 size-9" />
            </li>
          ))}
        </ul>
      </section>

      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-6 sm:px-6 md:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <Blob className="top-10 left-0 h-80 w-[30rem] bg-[#ffd9e8]/60" />
        <div className="relative mx-auto w-60 md:w-full md:max-w-sm">
          <Sparks className="absolute top-0 right-6 size-14" />
          <Image src="/images/sitio/clubi-regalo.png" alt="Clubi" width={302} height={309} className="w-full" />
        </div>
        <div>
          <SectionTitle>{t.rich("whyTitle", rich)}</SectionTitle>
          <ul className="mt-6 space-y-3 text-lg lg:text-xl">
            {WHY.map((key) => (
              <li key={key} className="flex items-center gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#2fc46b]">
                  <Check className="size-5 text-white" strokeWidth={3.5} />
                </span>
                <span>{t.rich(key, rich)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        className="lg:pr-72"
        art={
          <div className="relative mx-auto w-52 lg:absolute lg:right-12 lg:-bottom-4 lg:w-60">
            <Sparks className="absolute -top-8 left-0 size-12 -scale-x-100" />
            <Image src="/images/sitio/regalos.png" alt="" width={221} height={176} className="w-full" />
          </div>
        }
      >
        <div className="lg:max-w-sm">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight lg:text-[2.4rem]">{t.rich("ctaTitle", rich)}</h2>
          <p className="mt-3 text-lg leading-snug">{t("ctaText")}</p>
        </div>
        <Cta href={DEMO_HREF} className="h-14 self-start px-8 text-xl lg:self-center">
          {t("cta")}
        </Cta>
      </CtaBand>
    </>
  );
}
