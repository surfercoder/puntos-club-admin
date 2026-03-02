import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { env } from "@/lib/env";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Puntos Club Admin",
  description: "Portal de administración de Puntos Club",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <GoogleMapsProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
            {children}
            <Toaster />
          </GoogleMapsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
