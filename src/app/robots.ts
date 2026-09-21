/**
 * robots.txt (plan M-07, S-27; Faz 5C / X-06).
 *
 * Public piyasa yüzeyi (`/dashboard`, `/markets`, `/symbol/*`, `/digest`) ve
 * pazarlama sayfaları taranabilir; kişisel `(private)` rotaları ve API yüzeyi
 * KAPATILIR. Sitemap referansı `NEXT_PUBLIC_SITE_URL` tabanlıdır.
 */
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

/** Kişisel uygulama grubu + BFF/API; tarayıcı erişimi gerekmez. */
const DISALLOW = [
  "/watchlist",
  "/portfolio",
  "/research",
  "/data",
  "/profile",
  "/kitchen-sink",
  "/api/",
] as const;

/** Açıkça izin verilen public yüzey (en belirgin kural kazanır). */
const ALLOW = ["/", "/dashboard", "/markets", "/symbol/", "/digest"] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [...ALLOW],
      disallow: [...DISALLOW],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
