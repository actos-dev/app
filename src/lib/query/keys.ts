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

  /** Simülasyon anahtarları ileride genişler (Faz 5). */
  simulations: {
    all: () => [...qk.all, "simulations"] as const,
    list: () => [...qk.simulations.all(), "list"] as const,
    detail: (id: string) => [...qk.simulations.all(), "detail", id] as const,
  },
} as const;
