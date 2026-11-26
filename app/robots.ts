import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

// /auth y /owner/onboarding no se bloquean aca: llevan noindex en sus layouts,
// y Google solo ve ese noindex si puede rastrear la pagina.
// OAI-SearchBot ya entraba por "*", pero va explicito (ticket Trello) y en el mismo
// grupo: un grupo propio con solo "Allow: /" le abriria /dashboard y /api.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: ["*", "OAI-SearchBot"], allow: "/", disallow: ["/dashboard", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
