import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BarChart3, Gift, Laptop, Play, Star, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HeroDashboard } from "@/components/sitio/hero-dashboard";
import { HomePlans } from "@/components/sitio/home-plans";
import { Blob, Cta, SectionTitle, Sparks } from "@/components/sitio/ui";
import { DEMO_HREF, rich } from "@/components/sitio/rich";
import { getPublicPlanLimits } from "@/lib/plans/public-limits";
import { SITE_URL } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const title = t("homeTitle");
  const description = t("homeDescription");
  return {
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", siteName: "Puntos Club", locale: "es_AR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Datos de la marca para Google (panel de conocimiento y logo en resultados).
// ponytail: sin sameAs hasta tener las URLs de las redes sociales.
const ORGANIZATION_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Puntos Club",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logos/logo-regalo.png`,
  email: "hola@puntosclub.com.ar",
};

const FEATURES = [
  { key: "feature1", icon: Star },
  { key: "feature2", icon: Gift },
  { key: "feature3", icon: BarChart3 },
  { key: "feature4", icon: Users },
] as const;

const STEPS = [
  { key: "step1", icon: Laptop },
  { key: "step2", icon: Users },
  { key: "step3", icon: Gift },
] as const;

export default async function Home() {
  const [t, planLimits] = await Promise.all([getTranslations("Site.home"), getPublicPlanLimits()]);

  return (
    <>
      <script
        type="application/ld+json"
        // Escapar "<" evita que un valor cierre el <script> (receta de la doc de Next).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-10 pb-6 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pt-14">
        <Blob className="top-0 right-0 h-96 w-[36rem] bg-[#ffd3e5]/70" />
        <div className="relative">
          <h1 className="text-4xl leading-[1.08] font-extrabold tracking-tight text-sitio-ink sm:text-5xl lg:text-[3.4rem]">
            {t.rich("title", rich)}
          </h1>
          <Sparks className="absolute -top-10 -right-4 hidden size-14 lg:block" />
          <div className="mt-9 flex flex-col items-start gap-4">
            <Cta href={DEMO_HREF} className="h-14 px-10 text-xl">
              {t("ctaDemo")}
            </Cta>
            <Cta
              href="#video"
              variant="outline"
              arrow={false}
              className="h-14 border-sitio-ink/80 px-8 text-xl font-medium"
              icon={
                <span className="flex size-8 items-center justify-center rounded-full bg-sitio-ink">
                  <Play className="size-3.5 fill-white text-white" />
                </span>
              }
            >
              {t("ctaHow")}
            </Cta>
          </div>
        </div>
        <HeroDashboard />
      </section>

      {/* Bajadas con íconos */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {FEATURES.map(({ key, icon: Icon }, i) => (
            <li key={key} className={`flex items-center gap-4 lg:px-5 ${i > 0 ? "lg:border-l lg:border-[#e9d9e3]" : ""}`}>
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#ffe3ee]">
                <Icon className="size-8 text-sitio-pink" strokeWidth={2} />
              </span>
              <span className="text-[1.05rem] leading-snug [&_strong]:block">{t.rich(key, rich)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Video: a la vista y con play manual; en un popup los clientes lo cerraban sin verlo. */}
      <section id="video" className="relative mx-auto max-w-5xl scroll-mt-28 px-4 py-12 sm:px-6 lg:px-10">
        <Blob className="top-1/3 -left-24 h-72 w-[30rem] bg-[#d9e8ff]/70" />
        <div className="relative mx-auto mb-8 w-fit">
          <SectionTitle className="text-center">{t.rich("videoTitle", rich)}</SectionTitle>
          <Sparks className="absolute -top-6 -right-12 size-12 rotate-12" />
        </div>
        {/* youtube-nocookie: no deja cookies hasta que le dan play y la vista igual cuenta. */}
        <iframe
          src="https://www.youtube-nocookie.com/embed/Bpd916s3U0s?rel=0"
          title={t("videoTitlePlain")}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="aspect-video w-full rounded-3xl bg-sitio-ink shadow-[0_24px_48px_-24px_rgba(80,40,90,0.55)] ring-1 ring-[#f1e3ea]"
        />
      </section>

      {/* Planes */}
      {planLimits && (
        <section id="planes" className="relative bg-gradient-to-b from-[#fde9f2] to-transparent py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="relative mx-auto mb-12 w-fit">
              <SectionTitle className="text-center">{t.rich("plansTitle", rich)}</SectionTitle>
              <Sparks className="absolute -top-6 -right-12 size-12 rotate-12" />
            </div>
            <HomePlans limits={planLimits} />
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pt-16 sm:px-6 lg:px-10">
        <Blob className="bottom-0 left-1/4 h-72 w-[40rem] bg-[#ffd9e8]/70" />
        <SectionTitle className="text-center">{t.rich("howTitle", rich)}</SectionTitle>
        <div className="mt-12 flex flex-col items-center gap-8 lg:flex-row lg:items-end">
          <ol className="grid flex-1 gap-8 pb-16 md:grid-cols-3 md:gap-4">
            {STEPS.map(({ key, icon: Icon }, i) => (
              <li key={key} className="flex items-start gap-4">
                <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[#ffd9e8]">
                  <Icon className="size-11 text-sitio-pink" strokeWidth={1.8} />
                </span>
                <div className="pt-1">
                  <h3 className="flex gap-2 text-xl leading-tight font-extrabold">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sitio-pink text-sm text-white">
                      {i + 1}
                    </span>
                    {t(`${key}Title`)}
                  </h3>
                  <p className="mt-2 text-[0.95rem] text-[#4b4b6b]">{t(`${key}Text`)}</p>
                </div>
                {i < STEPS.length - 1 && <ArrowRight className="mt-9 hidden size-5 shrink-0 text-sitio-pink md:block" />}
              </li>
            ))}
          </ol>
          <div className="relative w-48 shrink-0 lg:w-56">
            <Sparks className="absolute top-6 -left-8 size-12 -scale-x-100" />
            <Image src="/images/sitio/clubi-pulgar.png" alt="Clubi" width={225} height={248} className="w-full" />
          </div>
        </div>
      </section>
    </>
  );
}
