import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

// /auth y /owner/onboarding no se bloquean aca: llevan noindex en sus layouts,
// y Google solo ve ese noindex si puede rastrear la pagina.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
