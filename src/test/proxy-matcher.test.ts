/**
 * Proxy koruma kapsamı testleri (Faz 5C / Birim 5C.2a, X-02; Faz 6 / S-05).
 *
 * Faz 5C ile koruma yalnız KİŞİSEL rotalara indi. Piyasa okuma rotaları
 * (`/markets`, `/symbol`, `/digest`) ve guest dashboard'a hazırlık için
 * `/dashboard` korunmaz; anonime açıktır (veri `serverApiFetch` ile çerezsiz
 * çekilir). Faz 6'da proxy tüm belge rotalarında koşar (CSP nonce), bu yüzden
 * koruma kararı matcher'dan çıkarılıp `isProtectedPath` ile test edilir.
 */
import { describe, expect, it } from "vitest";

import { config, isProtectedPath } from "@/proxy";

describe("isProtectedPath — koruma kapsamı (X-02)", () => {
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
      expect(isProtectedPath(path), path).toBe(true);
    }
  });

  it("piyasa okuma ve guest dashboard rotalarını KORUMAZ", () => {
    for (const path of [
      "/",
      "/markets",
      "/markets/anything",
      "/symbol/THYAO",
      "/digest",
      "/dashboard",
      "/legal/cookie_policy",
    ]) {
      expect(isProtectedPath(path), path).toBe(false);
    }
  });

  it("benzer önekleri yanlışlıkla korumaz", () => {
    expect(isProtectedPath("/profiles")).toBe(false);
    expect(isProtectedPath("/data-center")).toBe(false);
  });
});

describe("proxy matcher — tüm belge rotalarında koşar (S-05)", () => {
  it("matcher kaynağı API ve statik varlıkları dışlar", () => {
    expect(config.matcher).toHaveLength(1);
    const rule = config.matcher[0];
    expect(typeof rule).toBe("object");
    // Nesne biçimindeki matcher tipini daralt (string matcher yok).
    if (typeof rule === "object" && "source" in rule) {
      expect(rule.source).toContain("api");
      expect(rule.source).toContain("_next");
    }
  });
});
