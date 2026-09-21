/**
 * `/dashboard` misafir (anonim) veri paketi (Faz 5C / X-09, X-05, X-07).
 *
 * Anonim ziyaretçiye değer üreten panel için YALNIZ public okuma uçları
 * çağrılır; kişisel uçlara (`/favorites`, `/portfolios/*`, `/credits`,
 * `/profile`) İSTEK ATILMAZ. Bu, testle kanıtlanır.
 *
 * İstek bütçesi (5 HTTP isteği, hepsi çerezsiz + `revalidate`):
 *   1) `/market/status`
 *   2) `/economy/quotes?symbols=USD,EUR,XAU-GRAM` (FX + metal tek istekte)
 *   3) `/companies/summary?sort=gainers&limit=` (yükselenler)
 *   4) `/companies/summary?sort=losers&limit=` (düşenler)
 *   5) `/digest` (yalnız güncel)
 *
 * Her yükleyici durum kodunu ve `Retry-After`'ı korur; biri `429` dönerse
 * sayfa kullanıcıya uyarı gösterir (X-07), çökmez/boş ekran göstermez.
 */
import { collectRateLimit, type RateLimitInfo } from "@/lib/api/rate-limit";
import { serverApiFetchWithStatus, type ServerApiResult } from "@/lib/api/server";
import { digestServerPath } from "@/lib/digest/api-paths";
import type { Digest } from "@/lib/digest/types";
import type { CompanySummary, CompanySummaryResponse, EconomyQuoteBundle, MarketStatus } from "@/types/market";

import { MARKET_CACHE_SECONDS } from "@/app/(app)/(public-market)/markets/markets-data";
import { PULSE_SYMBOLS, type DashboardDigest } from "./dashboard-data";

/** Yükselen/düşen listelerinde gösterilen azami satır. */
export const GUEST_MOVERS_LIMIT = 5;

export type GuestDashboardData = {
  /** Paylaşılan piyasa durumu; başarısızsa `null`. */
  status: MarketStatus | null;
  /** Piyasa nabzı quote paketi; başarısızsa `null`. */
  pulse: EconomyQuoteBundle | null;
  /** Yükselen hisseler; hata/boşta boş dizi. */
  gainers: CompanySummary[];
  /** Düşen hisseler; hata/boşta boş dizi. */
  losers: CompanySummary[];
  /** Güncel bülten; yok/hata ayrımı `failed` ile. */
  digest: DashboardDigest;
  /** En az bir public istek `429` döndüyse dolu (X-07). */
  rateLimit: RateLimitInfo;
};

/** Yükselen/düşen mover listesini çeker (tek istek). */
function fetchMovers(
  sort: "gainers" | "losers",
): Promise<ServerApiResult<CompanySummaryResponse>> {
  return serverApiFetchWithStatus<CompanySummaryResponse>("/api/v1/companies/summary", {
    revalidate: MARKET_CACHE_SECONDS,
    query: { sort, limit: GUEST_MOVERS_LIMIT },
  });
}

/** Tüm misafir paketini paralel yükler. */
export async function fetchGuestDashboardData(): Promise<GuestDashboardData> {
  const [status, pulse, gainers, losers, digestResult] = await Promise.all([
    serverApiFetchWithStatus<MarketStatus>("/api/v1/market/status", {
      revalidate: MARKET_CACHE_SECONDS,
    }),
    serverApiFetchWithStatus<EconomyQuoteBundle>("/api/v1/economy/quotes", {
      revalidate: MARKET_CACHE_SECONDS,
      query: { symbols: PULSE_SYMBOLS.join(",") },
    }),
    fetchMovers("gainers"),
    fetchMovers("losers"),
    serverApiFetchWithStatus<Digest>(digestServerPath(), {
      revalidate: 60,
    }),
  ]);

  const digest: DashboardDigest =
    digestResult.data && digestResult.status >= 200 && digestResult.status < 300
      ? { digest: digestResult.data, failed: false }
      : { digest: null, failed: digestResult.status !== 404 };

  return {
    status: status.data,
    pulse: pulse.data,
    gainers: gainers.data?.data ?? [],
    losers: losers.data?.data ?? [],
    digest,
    rateLimit: collectRateLimit([status, pulse, gainers, losers, digestResult]),
  };
}
