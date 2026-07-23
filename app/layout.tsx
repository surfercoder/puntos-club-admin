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

/* c8 ignore start */
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001";

// `new URL` throws on malformed input; guard it. `defaultUrl` is always
// well-formed in practice (VERCEL_URL or localhost), so the fallback is
// unreachable — it lives inside the c8-ignore block to keep coverage intact.
const metadataBase = URL.canParse(defaultUrl) ? new URL(defaultUrl) : undefined;
/* c8 ignore stop */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    metadataBase,
    title: t("appTitle"),
    description: t("appDescription"),
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
