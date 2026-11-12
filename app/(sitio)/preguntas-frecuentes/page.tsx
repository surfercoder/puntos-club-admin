import type { Metadata } from "next";
import Image from "next/image";
import { MessageCircleMore } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaBand } from "@/components/sitio/cta-band";
import { FaqExplorer } from "@/components/sitio/faq-explorer";
import { Blob, Cta, Pill, Sparks } from "@/components/sitio/ui";
import { DEMO_HREF, rich } from "@/components/sitio/rich";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("faqTitle"), description: t("faqDescription"), alternates: { canonical: "/preguntas-frecuentes" } };
}

export default async function PreguntasFrecuentesPage() {
  const t = await getTranslations("Site.faq");

  return (
    <>
      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pt-8 pb-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <Blob className="top-0 right-0 h-96 w-[34rem] bg-[#fff0c2]/60" />
        <Blob className="top-40 -left-20 h-72 w-96 bg-[#ffd9e8]/60" />
        <div>
          <Pill>{t("pill")}</Pill>
          <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.6rem]">
            {t.rich("title", rich)}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-snug lg:text-xl">{t("subtitle")}</p>
          <Cta href={DEMO_HREF} className="mt-7 h-14 px-9 text-xl">
            {t("cta")}
          </Cta>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <Sparks className="absolute top-2 right-0 size-14" />
          <Image src="/images/sitio/clubi-pensando.png" alt="Clubi" width={267} height={346} priority className="w-full" />
        </div>
      </section>

      <FaqExplorer />

      <CtaBand
        className="mt-10 lg:pl-72"
        art={
          <>
            <Image
              src="/images/sitio/clubi-chau.png"
              alt=""
              width={253}
              height={270}
              className="mx-auto w-44 lg:absolute lg:bottom-0 lg:left-10 lg:w-56"
            />
            <div className="absolute top-8 right-10 hidden w-24 lg:block">
              <Image src="/images/sitio/burbuja-chat.png" alt="" width={92} height={71} className="w-full" />
              <Sparks className="absolute -top-6 -right-8 size-10" />
            </div>
          </>
        }
      >
        <div className="lg:max-w-2xl">
          <h2 className="text-3xl leading-tight font-extrabold tracking-tight lg:text-[2.6rem]">{t.rich("moreTitle", rich)}</h2>
          <p className="mt-3 text-lg leading-snug">{t("moreText")}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Cta href={DEMO_HREF} className="h-13 px-8">
              {t("moreDemo")}
            </Cta>
            <Cta
              href="mailto:hola@puntosclub.com.ar"
              variant="outline"
              arrow={false}
              className="h-13 px-7 text-sitio-blue"
              icon={<MessageCircleMore className="size-6 text-[#14b866]" />}
            >
              {t("moreAdvisor")}
            </Cta>
          </div>
        </div>
      </CtaBand>
    </>
  );
}
