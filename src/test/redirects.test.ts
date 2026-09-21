/**
 * Eski URL yönlendirme testleri (Faz 2 / Birim 2.3a, S-27).
 *
 * `next.config.ts` `redirects()` ile aynı tabloyu tüketir; her satır kalıcı
 * (308) olmalı ve kaynaklar benzersiz olmalıdır.
 */
import { describe, expect, it } from "vitest";

import { legacyRedirects } from "@/config/redirects";

const EXPECTED: ReadonlyArray<readonly [string, string]> = [
  ["/stocks", "/markets"],
  ["/stocks/:ticker", "/symbol/:ticker"],
  ["/currency", "/markets"],
  ["/metals", "/markets"],
  ["/ipos", "/markets"],
  ["/reports", "/research/reports"],
  ["/reports/:id", "/research/reports/:id"],
  ["/simulation", "/research/simulation"],
  ["/advisor", "/research/advisor"],
  ["/portfolios", "/portfolio"],
  ["/portfolios/:id", "/portfolio/:id"],
];

describe("legacyRedirects", () => {
  it("beklenen eşlemeleri kalıcı olarak tanımlar", () => {
    for (const [source, destination] of EXPECTED) {
      const match = legacyRedirects.find((redirect) => redirect.source === source);
      expect(match, `${source} tanımlı olmalı`).toBeDefined();
      expect(match?.destination).toBe(destination);
      expect(match?.permanent).toBe(true);
    }
  });

  it("kaynaklar benzersizdir", () => {
    const sources = legacyRedirects.map((redirect) => redirect.source);
    expect(new Set(sources).size).toBe(sources.length);
  });
});
