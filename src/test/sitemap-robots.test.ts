/**
 * sitemap/robots testleri (Faz 2 / Birim 2.3a, S-27; Faz 5C / X-06).
 *
 * Sitemap: public pazarlama rotaları + piyasa rotaları + GERÇEK sembol
 * sayfaları (BIST sayfalı çağrı + ekonomi kanonikleri) listelenir; `(private)`
 * rotalar bulunmaz. Robots: public yüzey izinli, kişisel ve API kapalı.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap, { fetchBistSymbols } from "@/app/sitemap";
import { getSiteUrl } from "@/config/site";
import { mockResponse } from "@/test/http";

const base = getSiteUrl();

type Handlers = Record<string, (url: URL) => Response>;

function installFetch(handlers: Handlers): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const raw =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(raw, "http://localhost:7055");
      const handler = handlers[url.pathname];
      if (!handler) {
        return mockResponse({ detail: "not found" }, 404);
      }
      return handler(url);
    }),
  );
}

function summaryRow(ticker: string) {
  return {
    ticker,
    name: `${ticker} A.Ş.`,
    sector: null,
    last_price: 10,
    change_pct: 1,
    previous_close: 9.9,
    absolute_change: 0.1,
    change_window: "last_session_change",
    market_status: "open",
    is_stale: false,
    as_of: "2026-09-22T08:00:00Z",
    previous_close_as_of: null,
    day_high: null,
    day_low: null,
    volume: 1,
    market_cap: 1,
    currency: "TRY",
    price_updated_at: null,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sitemap (5C / X-06)", () => {
  it("public rotaları ve gerçek sembolleri içerir", async () => {
    installFetch({
      "/api/v1/companies/summary": () =>
        mockResponse({ data: [summaryRow("THYAO"), summaryRow("ASELS")], total: 2 }),
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    for (const path of [
      "/",
      "/about",
      "/contact",
      "/downloads",
      "/legal/terms",
      "/legal/privacy_policy",
      "/legal/cookie_policy",
      "/legal/disclaimer",
      "/markets",
      "/digest",
    ]) {
      expect(urls).toContain(`${base}${path}`);
    }

    // BIST (API'den) + ekonomi (kanonik registry).
    expect(urls).toContain(`${base}/symbol/THYAO`);
    expect(urls).toContain(`${base}/symbol/ASELS`);
    expect(urls).toContain(`${base}/symbol/USD`);
    expect(urls).toContain(`${base}/symbol/XAU-GRAM`);
  });

  it("(private) ve auth rotalarını içermez", async () => {
    installFetch({
      "/api/v1/companies/summary": () => mockResponse({ data: [], total: 0 }),
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    for (const path of [
      "/watchlist",
      "/portfolio",
      "/research/reports",
      "/data",
      "/profile",
      "/dashboard",
      "/login",
      "/register",
    ]) {
      expect(urls.some((url) => url.endsWith(path))).toBe(false);
    }
  });

  it("backend kapalıyken yalnız ekonomi sembollerini döner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("backend unreachable");
      }),
    );

    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain(`${base}/symbol/USD`);
    expect(urls.some((url) => url.endsWith("/symbol/THYAO"))).toBe(false);
  });
});

describe("fetchBistSymbols", () => {
  it("total'a ulaşana kadar sayfalar", async () => {
    const pageSize = 2;
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
        );
        calls += 1;
        const offset = Number(url.searchParams.get("offset") ?? "0");
        const rows =
          offset === 0
            ? [summaryRow("AAA"), summaryRow("BBB")]
            : offset === pageSize
              ? [summaryRow("CCC")]
              : [];
        return mockResponse({ data: rows, total: 3 });
      }),
    );

    const tickers = await fetchBistSymbols();
    expect(tickers).toEqual(["AAA", "BBB", "CCC"]);
    expect(calls).toBe(2);
  });
});

describe("robots (5C / X-06)", () => {
  it("public yüzeye izin verir; kişisel ve api'yi kapatır", () => {
    const { rules, sitemap: sitemapUrl } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;

    expect(rule.allow).toEqual(["/", "/dashboard", "/markets", "/symbol/", "/digest"]);
    expect(rule.disallow).toEqual([
      "/watchlist",
      "/portfolio",
      "/research",
      "/data",
      "/profile",
      "/kitchen-sink",
      "/api/",
    ]);
    expect(sitemapUrl).toBe(`${base}/sitemap.xml`);
  });
});
