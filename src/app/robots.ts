/**
 * robots.txt (plan M-07, S-27).
 *
 * Public rotalar taranabilir; uygulama ve API yüzeyi kapatılır. Sitemap
 * referansı `NEXT_PUBLIC_SITE_URL` tabanlıdır.
 */
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

const DISALLOW = [
  "/dashboard",
  "/markets",
  "/portfolio",
  "/research",
  "/data",
  "/profile",
  "/api/",
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...DISALLOW],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
