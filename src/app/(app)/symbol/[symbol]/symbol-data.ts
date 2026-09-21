/**
 * `/symbol/[symbol]` sunucu veri yükleyicileri (Faz 3 / Birim 3.3).
 *
 * Tüm çağrılar `serverAuthApiFetch` (çerez forward) ile yapılır; yalnız BIST
 * profil doğrulaması durum kodu gerektirir (404 → `notFound`, diğer hatalar
 * → zarif eksik veri). Bu yüzden profil için durum-farkında küçük bir yükleyici
 * kullanılır; `src/lib/api/*` kasıtlı olarak değiştirilmez (bkz. rapor:
 * `serverAuthApiFetch`'in durum-döndüren bir varyantı önerilir).
 *
 * `cache()` ile aynı istek içinde `generateMetadata` + sayfa arasında tekrar
 * eden istekler tekilleştirilir.
 */
import { headers } from "next/headers";
import { cache } from "react";

import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { getApiBaseUrl } from "@/lib/auth/constants";
import { companyInfoPath, newsPath } from "@/lib/markets/api-paths";
import type {
  CompanyInfo,
  CompanySummary,
  CompanySummaryResponse,
  EconomyQuote,
  EconomyQuoteBundle,
  NewsArticle,
} from "@/types/market";

export type CompanyProfileResult = {
  /** HTTP durum kodu; ağ hatasında `0`. */
  status: number;
  data: CompanyInfo | null;
};

/**
 * BIST profilini durum koduyla çeker. `404` bilinmeyen ticker demektir;
 * ağ/5xx hatalarında `data: null` döner ki sayfa çökmesin.
 */
export const fetchCompanyProfile = cache(
  async (ticker: string): Promise<CompanyProfileResult> => {
    let cookie: string | null = null;
    try {
      cookie = (await headers()).get("cookie");
    } catch {
      // İstek bağlamı dışında (izole test) çerezsiz devam et.
      cookie = null;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}${companyInfoPath(ticker)}`, {
        headers: { accept: "application/json", ...(cookie ? { cookie } : {}) },
        cache: "no-store",
      });
      if (!response.ok) {
        return { status: response.status, data: null };
      }
      return { status: response.status, data: (await response.json()) as CompanyInfo };
    } catch {
      return { status: 0, data: null };
    }
  },
);

/** BIST canlı fiyat + tazelik bilgisi (tek ticker filtresiyle). */
export const fetchCompanySummary = cache(
  async (ticker: string): Promise<CompanySummary | null> => {
    const response = await serverAuthApiFetch<CompanySummaryResponse>(
      "/api/v1/companies/summary",
      { query: { tickers: ticker, limit: 1 } },
    );
    return response?.data[0] ?? null;
  },
);

/** Economy kanonik sembolü için tek quote (paket içinden seçilir). */
export const fetchEconomyQuote = cache(
  async (symbol: string): Promise<EconomyQuote | null> => {
    const bundle = await serverAuthApiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
      query: { symbols: symbol },
    });
    return bundle?.quotes[symbol] ?? null;
  },
);

/**
 * BIST haberi. `null` = istek başarısız (hata durumu gösterilir); `[]` = başarılı
 * ama boş (boş durum gösterilir). İkisi karıştırılmaz.
 */
export const fetchTickerNews = cache(
  async (ticker: string): Promise<NewsArticle[] | null> =>
    serverAuthApiFetch<NewsArticle[]>(newsPath(ticker), { query: { amount: 10 } }),
);
