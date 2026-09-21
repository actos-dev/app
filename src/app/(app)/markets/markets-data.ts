/**
 * `/markets` sunucu veri yükleyicileri (Faz 3 / Birim 3.2).
 *
 * Tüm çağrılar `serverAuthApiFetch` üzerinden, gelen isteğin çerezi iletilerek
 * yapılır. Her yükleyici en fazla BİR liste isteği atar (P-02: satır başına
 * fiyat isteği yok; fiyatlar liste yanıtından gelir). Backend kapalı/hata
 * durumunda `null` döner; sayfa zarif boş/hata durumu gösterir.
 */
import { serverAuthApiFetch } from "@/lib/api/server-auth";
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

/** Paylaşılan piyasa durumu (public uç; yine de çerez iletilir). */
export function fetchMarketStatus(): Promise<MarketStatus | null> {
  return serverAuthApiFetch<MarketStatus>("/api/v1/market/status");
}

/** BIST özet listesi; sunucu taraflı sıralama + sayfalama. */
export function fetchCompaniesSummary(
  sort: CompanySummarySort,
  page: number,
): Promise<CompanySummaryResponse | null> {
  return serverAuthApiFetch<CompanySummaryResponse>("/api/v1/companies/summary", {
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
): Promise<EconomyQuoteBundle | null> {
  return serverAuthApiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
    query: { group },
  });
}

export type IposPayload = {
  /** Aktif + yaklaşan + taslak tek tabloda, durum etiketiyle. */
  rows: IpoRow[];
  /** Üç uç da başarısızsa `true`; en az biri döndüyse `false`. */
  failed: boolean;
};

function tagRows(items: IpoListItem[], status: IpoRow["status"]): IpoRow[] {
  return items.map((item) => ({ ...item, status }));
}

/** Aktif/yaklaşan/taslak halka arzları paralel çekip tek listeye indirger. */
export async function fetchIpos(): Promise<IposPayload> {
  const [active, upcoming, draft] = await Promise.all([
    serverAuthApiFetch<IpoListItem[]>("/api/v1/ipos/active"),
    serverAuthApiFetch<IpoListItem[]>("/api/v1/ipos/upcoming"),
    serverAuthApiFetch<IpoListItem[]>("/api/v1/ipos/draft"),
  ]);

  if (active === null && upcoming === null && draft === null) {
    return { rows: [], failed: true };
  }

  const rows = [
    ...tagRows(active ?? [], "active"),
    ...tagRows(upcoming ?? [], "upcoming"),
    ...tagRows(draft ?? [], "draft"),
  ];
  return { rows, failed: false };
}
