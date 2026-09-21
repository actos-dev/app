/**
 * `/markets` sunucu veri yükleyicileri (Faz 3 / Birim 3.2; Faz 5C / X-05, X-07).
 *
 * Faz 5C ile piyasa okuma uçları anonime açıldı: tüm çağrılar artık
 * `serverApiFetch` (ÇEREZSİZ) + `revalidate` ile yapılır, böylece yanıtlar
 * paylaşılan önbelleğe girebilir ve anonim istekler kişiye özel veri taşımaz.
 * Her yükleyici en fazla BİR liste isteği atar (P-02: satır başına fiyat
 * isteği yok; fiyatlar liste yanıtından gelir).
 *
 * Liste yükleyicileri durum kodunu da döndürür (`ServerApiResult`): böylece
 * sayfa `429` / `Retry-After` durumunu ayırt edip kullanıcıya uyarı
 * gösterebilir (X-07). Backend kapalı/hata durumunda `data: null` döner;
 * sayfa zarif boş/hata durumu gösterir.
 */
import { type RateLimitResult } from "@/lib/api/rate-limit";
import { serverApiFetchWithStatus, type ServerApiResult } from "@/lib/api/server";
import { MARKETS_PAGE_SIZE } from "@/lib/markets/params";
import type {
  CompanySummaryResponse,
  CompanySummarySort,
  EconomyQuoteBundle,
  EconomyQuoteGroup,
  IpoListItem,
  IpoRow,
  MarketStatus,
} from "@/types/market";

/** `/markets` asset sekmesinden backend `group` değerine eşleme. */
export const ECONOMY_GROUP_BY_ASSET = {
  fx: "fx",
  metals: "metal",
} as const satisfies Record<"fx" | "metals", EconomyQuoteGroup>;

/** Piyasa verisi ISR süresi (saniye); arka planda tazelenir. */
export const MARKET_CACHE_SECONDS = 30;

/**
 * Paylaşılan piyasa durumu, durum kodu olmadan (public uç; çerezsiz).
 *
 * Dashboard/watchlist yalnız veriyi kullanır; `/markets` 429 ayrımı için
 * `fetchMarketStatusResult` çağırır.
 */
export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  return (await fetchMarketStatusResult()).data;
}

/** Piyasa durumu + durum kodu (429/`Retry-After` ayrımı için, X-07). */
export function fetchMarketStatusResult(): Promise<ServerApiResult<MarketStatus>> {
  return serverApiFetchWithStatus<MarketStatus>("/api/v1/market/status", {
    revalidate: MARKET_CACHE_SECONDS,
  });
}

/** BIST özet listesi; sunucu taraflı sıralama + sayfalama. */
export function fetchCompaniesSummary(
  sort: CompanySummarySort,
  page: number,
): Promise<ServerApiResult<CompanySummaryResponse>> {
  return serverApiFetchWithStatus<CompanySummaryResponse>("/api/v1/companies/summary", {
    revalidate: MARKET_CACHE_SECONDS,
    query: {
      limit: MARKETS_PAGE_SIZE,
      offset: (page - 1) * MARKETS_PAGE_SIZE,
      sort,
    },
  });
}

/** Tek istekte tüm FX veya metal quote'ları (P-02). */
export function fetchEconomyQuotes(
  group: EconomyQuoteGroup,
): Promise<ServerApiResult<EconomyQuoteBundle>> {
  return serverApiFetchWithStatus<EconomyQuoteBundle>("/api/v1/economy/quotes", {
    revalidate: MARKET_CACHE_SECONDS,
    query: { group },
  });
}

export type IposPayload = {
  /** Aktif + yaklaşan + taslak tek tabloda, durum etiketiyle. */
  rows: IpoRow[];
  /** Üç uç da başarısızsa `true`; en az biri döndüyse `false`. */
  failed: boolean;
  /** Üç paralel isteğin ham sonuçları; 429/`Retry-After` ayrımı için. */
  results: RateLimitResult[];
};

function tagRows(items: IpoListItem[], status: IpoRow["status"]): IpoRow[] {
  return items.map((item) => ({ ...item, status }));
}

/** Aktif/yaklaşan/taslak halka arzları paralel çekip tek listeye indirger. */
export async function fetchIpos(): Promise<IposPayload> {
  const [active, upcoming, draft] = await Promise.all([
    serverApiFetchWithStatus<IpoListItem[]>("/api/v1/ipos/active", {
      revalidate: MARKET_CACHE_SECONDS,
    }),
    serverApiFetchWithStatus<IpoListItem[]>("/api/v1/ipos/upcoming", {
      revalidate: MARKET_CACHE_SECONDS,
    }),
    serverApiFetchWithStatus<IpoListItem[]>("/api/v1/ipos/draft", {
      revalidate: MARKET_CACHE_SECONDS,
    }),
  ]);

  const results: RateLimitResult[] = [active, upcoming, draft];

  if (active.data === null && upcoming.data === null && draft.data === null) {
    return { rows: [], failed: true, results };
  }

  const rows = [
    ...tagRows(active.data ?? [], "active"),
    ...tagRows(upcoming.data ?? [], "upcoming"),
    ...tagRows(draft.data ?? [], "draft"),
  ];
  return { rows, failed: false, results };
}
