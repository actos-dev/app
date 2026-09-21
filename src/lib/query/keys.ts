/**
 * Tek query-key fabrikası (plan P-03).
 *
 * Aynı endpoint'in birden çok key altında kullanılmasını engellemek için tüm
 * anahtarlar burada üretilir; bileşenler elle dizi yazmaz. Parametreler
 * kanonikleştirilir (ticker büyük harf, liste sıralı) ki aynı istek her zaman
 * aynı anahtara düşsün ve merkezî invalidation tek noktadan çalışsın.
 */
import type {
  CompanySummarySort,
  EconomyQuoteGroup,
} from "@/types/market";

export type CompanyListParams = {
  limit?: number;
  offset?: number;
  sort?: CompanySummarySort;
  tickers?: readonly string[];
};

export type EconomyQuotesParams = {
  group?: EconomyQuoteGroup;
  symbols?: readonly string[];
};

/** Ticker/sembol listelerini sıralı-büyük harfe çevirir. */
function normalizeSymbols(symbols: readonly string[] | undefined): string[] | undefined {
  if (!symbols || symbols.length === 0) {
    return undefined;
  }
  return Array.from(new Set(symbols.map((symbol) => symbol.trim().toUpperCase())))
    .filter((symbol) => symbol.length > 0)
    .sort();
}

export const qk = {
  /** Tüm Florence anahtarlarının kökü; toplu invalidation için. */
  all: ["florence"] as const,

  marketStatus: () => [...qk.all, "market-status"] as const,

  companies: (params: CompanyListParams = {}) =>
    [
      ...qk.all,
      "companies",
      {
        limit: params.limit ?? null,
        offset: params.offset ?? null,
        sort: params.sort ?? null,
        tickers: normalizeSymbols(params.tickers) ?? null,
      },
    ] as const,

  companyInfo: (ticker: string) =>
    [...qk.all, "company-info", ticker.trim().toUpperCase()] as const,

  /** Sembol arama sorgusu (P-03); aynı terim tüm bileşenlerde paylaşılır. */
  companySearch: (query: string) =>
    [...qk.all, "company-search", query.trim()] as const,

  priceHistory: (ticker: string, period = "1mo", interval = "1d") =>
    [
      ...qk.all,
      "price-history",
      ticker.trim().toUpperCase(),
      { period, interval },
    ] as const,

  news: (ticker: string, amount = 10) =>
    [...qk.all, "news", ticker.trim().toUpperCase(), amount] as const,

  economyQuotes: (params: EconomyQuotesParams = {}) =>
    [
      ...qk.all,
      "economy-quotes",
      {
        group: params.group ?? null,
        symbols: normalizeSymbols(params.symbols) ?? null,
      },
    ] as const,

  economyHistory: (symbol: string, period = "1y") =>
    [...qk.all, "economy-history", symbol.trim().toUpperCase(), period] as const,

  favorites: () => [...qk.all, "favorites"] as const,

  /**
   * Portföy anahtarları (Faz 4 / Birim 4.1, P-03).
   *
   * Liste, özet ve detay aynı kökün (`qk.portfolios()`) altındadır; böylece
   * oluştur/sil/çoğalt sonrası TEK `invalidateQueries({ queryKey: qk.portfolios() })`
   * çağrısı tüm portföy sorgularını tazeler. Portföy kimlikleri kanonikleştirilir
   * (trim) ki aynı kimlik her zaman aynı anahtara düşsün.
   */
  portfolios: () => [...qk.all, "portfolios"] as const,

  /** `GET /portfolios/summaries` — değerlemeli liste (B-10). */
  portfolioSummaries: () => [...qk.portfolios(), "summaries"] as const,

  /** `GET /portfolios` — ham liste; summaries yoksa fallback (B-10). */
  portfolioList: () => [...qk.portfolios(), "list"] as const,

  /** `GET /portfolios/{id}` — tek portföy detayı. */
  portfolio: (id: string) => [...qk.portfolios(), "detail", id.trim()] as const,

  /** `GET /portfolios/{id}/valuation` — güncel değerleme. */
  portfolioValuation: (id: string) =>
    [...qk.portfolios(), "valuation", id.trim()] as const,

  /** `GET /portfolios/{id}/transactions` — işlem geçmişi. */
  portfolioTransactions: (id: string) =>
    [...qk.portfolios(), "transactions", id.trim()] as const,

  /** `GET /portfolios/{id}/diversification` — dağılım (4.3). */
  portfolioDiversification: (id: string) =>
    [...qk.portfolios(), "diversification", id.trim()] as const,

  /** `GET /portfolios/{id}/performers` — öne çıkan pozisyonlar (4.3). */
  portfolioPerformers: (id: string) =>
    [...qk.portfolios(), "performers", id.trim()] as const,

  /** `GET /portfolios/{id}/history?period=` — değer serisi (4.3). */
  portfolioHistory: (id: string, period = "1mo") =>
    [...qk.portfolios(), "history", id.trim(), period] as const,

  /** `GET /portfolios/{id}/returns?period=` — dönem getirisi (4.3). */
  portfolioReturns: (id: string, period = "1mo") =>
    [...qk.portfolios(), "returns", id.trim(), period] as const,

  /** `GET /portfolios/{id}/risk?period=` — risk metrikleri (4.3). */
  portfolioRisk: (id: string, period = "1y") =>
    [...qk.portfolios(), "risk", id.trim(), period] as const,

  /** `GET /portfolios/{id}/benchmark?ticker=` — kıyas (4.3). */
  portfolioBenchmark: (id: string, ticker = "XU100") =>
    [...qk.portfolios(), "benchmark", id.trim(), ticker.trim().toUpperCase()] as const,

  /** `GET /portfolios/{id}/performance` — işlem verimliliği (4.3). */
  portfolioPerformance: (id: string) =>
    [...qk.portfolios(), "performance", id.trim()] as const,

  /**
   * Al/sat diyaloğu birim fiyatı (Faz 4 / Birim 4.2).
   *
   * Sembol başına TEK anahtar; aynı sembol için diyalog yeniden açıldığında
   * önbellekten gelir, satır/liste başına istek üretilmez. Portföy kökü
   * dışındadır: portföy yazmaları fiyatı gereksiz tazelemez.
   */
  tradePrice: (symbol: string) =>
    [...qk.all, "trade-price", symbol.trim().toUpperCase()] as const,

  /** Simülasyon anahtarları ileride genişler (Faz 5). */
  simulations: {
    all: () => [...qk.all, "simulations"] as const,
    list: () => [...qk.simulations.all(), "list"] as const,
    detail: (id: string) => [...qk.simulations.all(), "detail", id] as const,
  },
} as const;
