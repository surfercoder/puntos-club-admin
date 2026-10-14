import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { StaleDeploymentReload } from "@/components/providers/stale-deployment-reload";
import { env } from "@/lib/env";
import { SITE_URL } from "@/lib/site-url";
import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    metadataBase: new URL(SITE_URL),
    title: t("appTitle"),
    description: t("appDescription"),
    openGraph: { siteName: "Puntos Club", locale: "es_AR", type: "website" },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        {/* GTM (y GA4 adentro) solo carga si el ID esta configurado en Vercel. */}
        {GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}
        <StaleDeploymentReload />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <GoogleMapsProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </GoogleMapsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
