/**
 * Proxy koruma kapsamı testleri (Faz 5C / Birim 5C.2a, X-02).
 *
 * Faz 5C ile koruma yalnız KİŞİSEL rotalara indi. Piyasa okuma rotaları
 * (`/markets`, `/symbol`, `/digest`) ve guest dashboard'a hazırlık için
 * `/dashboard` matcher'dan çıkarıldı; anonime açıktır (veri `serverApiFetch`
 * ile çerezsiz çekilir).
 */
import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

function matches(pathname: string): boolean {
  return config.matcher.some((pattern) => {
    if (pattern.endsWith(":path*")) {
      const base = pattern.slice(0, -":path*".length);
      return pathname === base.replace(/\/$/, "") || pathname.startsWith(base);
    }
    return pathname === pattern;
  });
}

describe("proxy matcher — koruma kapsamı (X-02)", () => {
  it("kişisel rotaları korur", () => {
    for (const path of [
      "/watchlist",
      "/watchlist/42",
      "/portfolio",
      "/portfolio/1",
      "/research/reports",
      "/research/simulation",
      "/research/advisor",
      "/data",
      "/profile",
      "/kitchen-sink",
    ]) {
      expect(matches(path), path).toBe(true);
    }
  });

  it("piyasa okuma ve guest dashboard rotalarını KORUMAZ", () => {
    for (const path of [
      "/markets",
      "/markets/anything",
      "/symbol/THYAO",
      "/digest",
      "/dashboard",
    ]) {
      expect(matches(path), path).toBe(false);
    }
  });
});
