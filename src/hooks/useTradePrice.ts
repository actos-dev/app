"use client";

/**
 * Al/sat diyaloğu birim fiyatı (Faz 4 / Birim 4.2, P-02, U-04).
 *
 * Diyalog bir sembol seçtiğinde TEK istek atılır; liste/satır başına fiyat
 * isteği yoktur. Sembol türüne göre uç değişir:
 *   - BIST   → `GET /price/current?ticker=`,
 *   - ekonomi → `GET /economy/quotes?symbols=<kanonik>` (tek sembol).
 *
 * `qk.tradePrice(symbol)` anahtarı paylaşıldığından aynı sembolle diyalog
 * yeniden açıldığında önbellekten gelir. Fiyat gelmezse `price: null` döner;
 * UI gönderimi engeller ve uyarı gösterir.
 */
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import { resolveSymbol } from "@/lib/markets/symbol";
import { qk } from "@/lib/query/keys";
import type { CurrentPriceQuote, EconomyQuoteBundle } from "@/types/market";

/** Fiyat sorgusunun UI'a indirgenmiş sonucu. */
export type TradePrice = {
  price: number | null;
  asOf: string | null;
  stale: boolean;
  isLoading: boolean;
  isError: boolean;
};

/** Seçili sembolün anlık fiyatını çeker; sembol yoksa sorgu kapalıdır. */
export function useTradePrice(symbol: string | null): TradePrice {
  const normalized = symbol?.trim() ?? "";
  const resolved = normalized.length > 0 ? resolveSymbol(normalized) : null;

  const query = useQuery({
    queryKey: qk.tradePrice(normalized),
    enabled: resolved !== null,
    // Fiyat kısa ömürlüdür; 10 sn içinde diyalog yeniden açılırsa önbellekten gelir.
    staleTime: 10_000,
    queryFn: async (): Promise<{ price: number | null; asOf: string | null; stale: boolean }> => {
      if (!resolved) {
        return { price: null, asOf: null, stale: false };
      }
      if (resolved.kind === "economy") {
        const bundle = await apiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
          query: { symbols: resolved.canonical },
        });
        const quote = bundle.quotes[resolved.canonical];
        return {
          price: quote?.price ?? quote?.selling ?? quote?.buying ?? null,
          asOf: quote?.ts ?? null,
          stale: quote?.stale ?? false,
        };
      }
      const quote = await apiFetch<CurrentPriceQuote>("/api/v1/price/current", {
        query: { ticker: resolved.canonical },
      });
      return { price: quote.price, asOf: quote.as_of, stale: quote.is_stale };
    },
  });

  return {
    price: query.data?.price ?? null,
    asOf: query.data?.asOf ?? null,
    stale: query.data?.stale ?? false,
    isLoading: query.isFetching,
    isError: query.isError,
  };
}
