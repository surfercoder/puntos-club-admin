import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mobile-apps`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/legal/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
