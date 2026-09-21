/**
 * `/symbol/[symbol]` sunucu veri yükleyicileri (Faz 3 / Birim 3.3; 5C / X-05).
 *
 * Faz 5C ile piyasa okuma uçları anonime açıldı: çağrılar artık `serverApiFetch`
 * (ÇEREZSİZ) + `revalidate` ile yapılır. Yalnız BIST profil doğrulaması durum
 * kodu gerektirir (404 → `notFound`, diğer hatalar → zarif eksik veri); bu
 * yüzden profil `serverApiFetchWithStatus` ile çekilir.
 *
 * `cache()` ile aynı istek içinde `generateMetadata` + sayfa arasında tekrar
 * eden istekler tekilleştirilir.
 */
import { cache } from "react";

import {
  serverApiFetch,
  serverApiFetchWithStatus,
  type ServerApiResult,
} from "@/lib/api/server";
import { companyInfoPath, newsPath } from "@/lib/markets/api-paths";
import type {
  CompanyInfo,
  CompanySummary,
  CompanySummaryResponse,
  EconomyQuote,
  EconomyQuoteBundle,
  NewsArticle,
} from "@/types/market";

export type CompanyProfileResult = ServerApiResult<CompanyInfo>;

/** Sembol verisi ISR süresi (saniye). */
const SYMBOL_CACHE_SECONDS = 30;
/** Haber ISR süresi (saniye); news rate-limit'ini de yumuşatır. */
const NEWS_CACHE_SECONDS = 60;

/**
 * BIST profilini durum koduyla çeker. `404` bilinmeyen ticker demektir;
 * ağ/5xx hatalarında `data: null` döner ki sayfa çökmesin.
 */
export const fetchCompanyProfile = cache(
  (ticker: string): Promise<CompanyProfileResult> =>
    serverApiFetchWithStatus<CompanyInfo>(companyInfoPath(ticker), {
      revalidate: SYMBOL_CACHE_SECONDS,
    }),
);

/** BIST canlı fiyat + tazelik bilgisi (tek ticker filtresiyle). */
export const fetchCompanySummary = cache(
  async (ticker: string): Promise<CompanySummary | null> => {
    const response = await serverApiFetch<CompanySummaryResponse>(
      "/api/v1/companies/summary",
      { revalidate: SYMBOL_CACHE_SECONDS, query: { tickers: ticker, limit: 1 } },
    );
    return response?.data[0] ?? null;
  },
);

/** Economy kanonik sembolü için tek quote (paket içinden seçilir). */
export const fetchEconomyQuote = cache(
  async (symbol: string): Promise<EconomyQuote | null> => {
    const bundle = await serverApiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
      revalidate: SYMBOL_CACHE_SECONDS,
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
    serverApiFetch<NewsArticle[]>(newsPath(ticker), {
      revalidate: NEWS_CACHE_SECONDS,
      query: { amount: 10 },
    }),
);
