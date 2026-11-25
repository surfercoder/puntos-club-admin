import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Blob, Cta, Pill } from "@/components/sitio/ui";
import { PUNTOS_CLUB_LOGO, PUNTOS_CLUB_PLAY_URL, PUNTOS_CLUB_WEB_URL } from "@/lib/mobile-apps";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("joinTitle"), description: t("joinDescription"), robots: { index: false } };
}

// Destino del QR de cada org cuando la app NO esta instalada: con la app,
// Android abre el mismo link directo en la app (App Link) y esta pagina no se ve.
export default async function UnirsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const t = await getTranslations("Site.join");

  return (
    <section className="relative mx-auto flex max-w-xl flex-col items-center px-4 pt-10 pb-16 text-center sm:px-6">
      <Blob className="top-0 right-0 h-72 w-72 bg-[#ffd3e5]/70" />
      <Image src={PUNTOS_CLUB_LOGO} alt="Puntos Club" width={96} height={96} priority className="rounded-3xl" />
      <Pill className="mt-6">{t("pill")}</Pill>
      <h1 className="mt-4 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 text-lg leading-snug">{t("subtitle")}</p>
      <div className="mt-8 flex w-full flex-col items-center gap-3">
        <Cta href={PUNTOS_CLUB_PLAY_URL} className="w-full max-w-sm">
          {t("play")}
        </Cta>
        {/* Si el App Link no se verifico (o el navegador no lo respeta), el esquema propio abre la app igual. */}
        <Cta href={`puntosclub://unirse/${id}`} variant="outline" arrow={false} className="w-full max-w-sm">
          {t("haveApp")}
        </Cta>
      </div>
      <a
        href={`${PUNTOS_CLUB_WEB_URL}/scan-organization?orgId=${id}`}
        className="mt-6 text-base font-medium text-sitio-blue underline underline-offset-4"
      >
        {t("web")}
      </a>
    </section>
  );
}
