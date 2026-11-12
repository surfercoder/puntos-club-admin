import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { ContactForm } from "@/components/sitio/contact-form";
import { Blob, Pill, Sparks } from "@/components/sitio/ui";
import { rich } from "@/components/sitio/rich";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("contactTitle"), description: t("contactDescription"), alternates: { canonical: "/contacto" } };
}

// No tiene mockup: arma el hero con las piezas del resto del sitio.
export default async function ContactoPage() {
  const t = await getTranslations("Site.contact");

  return (
    <section className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-14">
      <Blob className="top-0 right-0 h-96 w-[34rem] bg-[#ffd3e5]/70" />
      <Blob className="bottom-0 left-0 h-72 w-80 bg-[#d6f5e3]/70" />
      <div>
        <Pill>{t("pill")}</Pill>
        <h1 className="mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.4rem]">
          {t.rich("title", rich)}
        </h1>
        <p className="mt-4 max-w-md text-lg leading-snug lg:text-xl">{t("subtitle")}</p>
        <p className="mt-4 text-[0.95rem]">
          {t("orWrite")}{" "}
          <a href="mailto:hola@puntosclub.com.ar" className="font-semibold text-sitio-pink hover:underline">
            hola@puntosclub.com.ar
          </a>
        </p>
        <div className="relative mt-6 hidden w-64 lg:block">
          <Sparks className="absolute top-0 right-0 size-12" />
          <Image src="/images/sitio/clubi-saluda.png" alt="Clubi" width={310} height={292} className="w-full" />
        </div>
      </div>
      <div className="rounded-3xl bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(80,40,90,0.45)] ring-1 ring-[#f1e3ea] sm:p-10">
        <ContactForm />
      </div>
    </section>
  );
}
