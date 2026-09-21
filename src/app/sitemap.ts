/**
 * Sitemap (plan M-07, S-27).
 *
 * Yalnız public URL'ler listelenir; uygulama ve auth rotaları HARİÇTİR
 * (onlar robots.txt ile de kapatılır). Taban adres `NEXT_PUBLIC_SITE_URL`.
 */
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/downloads",
  "/legal/terms",
  "/legal/privacy_policy",
  "/legal/cookie_policy",
  "/legal/disclaimer",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
