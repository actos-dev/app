/**
 * sitemap/robots testleri (Faz 2 / Birim 2.3a, S-27).
 *
 * Beklenen public URL'ler listelenir; uygulama/auth rotaları sitemap'te
 * bulunmamalı, robots.txt ise onları kapatmalıdır.
 */
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl } from "@/config/site";

const base = getSiteUrl();

describe("sitemap", () => {
  it("public URL'leri içerir", () => {
    const urls = sitemap().map((entry) => entry.url);

    for (const path of [
      "/",
      "/about",
      "/contact",
      "/downloads",
      "/legal/terms",
      "/legal/privacy_policy",
      "/legal/cookie_policy",
      "/legal/disclaimer",
    ]) {
      expect(urls).toContain(`${base}${path}`);
    }
  });

  it("app ve auth rotalarını içermez", () => {
    const urls = sitemap().map((entry) => entry.url);

    for (const path of ["/dashboard", "/markets", "/portfolio", "/research", "/login", "/register"]) {
      expect(urls.some((url) => url.endsWith(path))).toBe(false);
    }
  });
});

describe("robots", () => {
  it("app rotalarını kapatır ve sitemap'e işaret eder", () => {
    const { rules, sitemap: sitemapUrl } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;

    expect(rule.disallow).toEqual([
      "/dashboard",
      "/markets",
      "/portfolio",
      "/research",
      "/data",
      "/profile",
      "/api/",
    ]);
    expect(sitemapUrl).toBe(`${base}/sitemap.xml`);
  });
});
