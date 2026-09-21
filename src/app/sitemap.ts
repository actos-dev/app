/**
 * Sitemap (plan M-07, S-27; Faz 5C / X-06).
 *
 * Public URL'ler listelenir: sabit pazarlama/yasal rotaları, piyasa rotaları
 * (`/markets`, `/digest`) ve GERÇEK sembol sayfaları (`/symbol/[ticker]`).
 * Kişisel uygulama rotaları (`(private)` grubu) ve auth HARİÇTİR; robots.txt
 * de onları kapatır. Taban adres `NEXT_PUBLIC_SITE_URL`.
 *
 * Sembol listesi iki kaynaktan gelir:
 *   - BIST: `GET /companies/summary` sayfalı (public, çerezsiz) çağrılarla,
 *   - ekonomi: `src/lib/markets/symbol.ts` kanonik registry sembolleri.
 *
 * Backend'e ulaşılamazsa yalnız ekonomi sembolleri listelenir; build çökmez.
 * `revalidate` sayesinde liste saatlik tazelenir.
 */
import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/site";
import { serverApiFetch } from "@/lib/api/server";
import { ECONOMY_SYMBOLS } from "@/lib/markets/symbol";
import type { CompanySummaryResponse } from "@/types/market";

/** Sitemap verisinin yeniden üretim süresi (saniye). */
export const revalidate = 3600;

/** `companies/summary` sayfa boyutu (backend `limit` üst sınırı 500). */
const SYMBOL_PAGE_SIZE = 500;
/** Sayfalama güvenlik tavanı (50k URL limitine karşı koruma). */
const SYMBOL_MAX_PAGES = 20;

const PUBLIC_ROUTES = [
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
] as const;

/**
 * BIST ticker'larını sayfalı public çağrıyla toplar.
 *
 * Tek tek sayfalar sıralı çekilir (paralel de olabilirdi ama `total` bilgisi
 * ilk yanıttan gelir ve istek sayısını sabit tutar). Hata/boşta eldeki liste
 * döner; çağıran taraf ekonomi sembollerini yine ekler.
 */
export async function fetchBistSymbols(): Promise<string[]> {
  const tickers = new Set<string>();
  let offset = 0;

  for (let page = 0; page < SYMBOL_MAX_PAGES; page += 1) {
    const response = await serverApiFetch<CompanySummaryResponse>("/api/v1/companies/summary", {
      revalidate,
      query: { limit: SYMBOL_PAGE_SIZE, offset },
    });

    const rows = response?.data ?? [];
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      tickers.add(row.ticker);
    }
    offset += rows.length;
    if (response && tickers.size >= response.total) {
      break;
    }
  }

  return [...tickers].sort();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const bistSymbols = await fetchBistSymbols();
  const symbolEntries: MetadataRoute.Sitemap = [...bistSymbols, ...ECONOMY_SYMBOLS].map(
    (ticker) => ({
      url: `${base}/symbol/${ticker}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...symbolEntries];
}
