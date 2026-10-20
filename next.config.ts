import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import createNextIntlPlugin from "next-intl/plugin";

import { PUNTOS_CLUB_CAJA_WEB_URL } from "./lib/mobile-apps";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Google todavia tiene indexada la URL vieja del login.
  async redirects() {
    return [{ source: "/login", destination: "/auth/login", statusCode: 301 }];
  },

  // caja-web llama a estos avisos desde el navegador, en otro origen: sin CORS el
  // preflight vuelve 204 pelado, el POST nunca sale y no llega ni push ni mail.
  async headers() {
    const cors = [
      { key: "Access-Control-Allow-Origin", value: PUNTOS_CLUB_CAJA_WEB_URL },
      { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
      { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
    ];
    return ["/api/purchase/notify", "/api/redemption/notify"].map((source) => ({
      source,
      headers: cors,
    }));
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "imi-health",
  project: "puntos-club-admin",

  // Source map upload auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload wider set of client source files for better stack traces
  widenClientFileUpload: true,

  // Proxy route to bypass ad-blockers
  tunnelRoute: "/monitoring",

  // Suppress non-CI output
  silent: !process.env.CI,
});
