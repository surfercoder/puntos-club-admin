import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LandingApp } from "@/components/landing/landing-app";
import { PublicHeader } from "@/components/public-header";
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
  logo: `${SITE_URL}/images/logos/LogoImage.png`,
  email: "hola@puntosclub.com.ar",
};

export default async function Home() {
  const planLimits = await getPublicPlanLimits();
  return (
    <>
      <script
        type="application/ld+json"
        // Escapar "<" evita que un valor cierre el <script> (receta de la doc de Next).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD).replace(/</g, "\\u003c") }}
      />
      <PublicHeader />
      <div className="relative z-0">
        <LandingApp planLimits={planLimits} />
      </div>
    </>
  );
}
