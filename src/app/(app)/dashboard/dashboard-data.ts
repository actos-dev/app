/**
 * `/dashboard` sunucu veri paketi (Faz 5B / Birim 5B.1, P-05).
 *
 * Amaç: dashboard'ın ihtiyaç duyduğu tüm veriyi TEK RSC paketi olarak, paralel
 * isteklerle toplamak. Kredi AppShell'de zaten çekildiği için burada TEKRAR
 * istenmez.
 *
 * İstek bütçesi (favori yoksa 5, favori varsa 6 HTTP isteği):
 *   1) `/portfolios/summaries` (B-10; özet + değerleme tek istekte)
 *   2) `/favorites`
 *   3) `/companies/summary?tickers=` — YALNIZ favori varsa (bağımlı, tek toplu)
 *   4) `/economy/quotes?symbols=USD,EUR,XAU-GRAM` — FX + metal TEK istekte
 *      (ayrı `group=fx` + `group=metal` yerine; P-02/P-05)
 *   5) `/market/status` (paylaşılan; B-01)
 *   6) `/digest` (yalnız güncel; tazelik sorgusu `/digest?at=` burada atılmaz)
 *
 * B-11 `GET /market/overview` gelince (4)+(5) tek çağrıya iner ve paket küçülür.
 *
 * Tüm çağrılar `serverAuthApiFetch` ile gelen isteğin çerezi iletilarak yapılır;
 * hata/ağ kesintisinde `null` döner, sayfa çökmez (zarif boş/hata durumu).
 */
import { fetchMarketStatus } from "@/app/(app)/markets/markets-data";
import { serverAuthApiFetch, serverAuthApiFetchWithStatus } from "@/lib/api/server-auth";
import { digestServerPath } from "@/lib/digest/api-paths";
import type { Digest } from "@/lib/digest/types";
import { WATCHLIST_TICKER_LIMIT } from "@/lib/markets/params";
import { portfolioSummariesServerPath } from "@/lib/portfolio/api-paths";
import type { PortfolioSummaryResponse } from "@/lib/portfolio/types";
import type { FavoritesResponse } from "@/types/favorites";
import type { CompanySummaryResponse, EconomyQuoteBundle, MarketStatus } from "@/types/market";

/**
 * "Piyasa nabzı" kartlarının kanonik sembolleri.
 *
 * Kanonik adlar backend `finance/symbols.py` kaynağından alınır: FX ISO kodu
 * (`USD`, `EUR`) ve metal `XAU-GRAM` (gram altın). Tek `symbols=` parametresiyle
 * hepsi birden istenir; `group` filtresi KULLANILMAZ ki tek çağrı yetsin.
 */
export const PULSE_SYMBOLS = ["USD", "EUR", "XAU-GRAM"] as const;

export type PulseSymbol = (typeof PULSE_SYMBOLS)[number];

/** Güncel bülten sonucu; `failed` boş durumdan (404) ağ hatasını ayırır. */
export type DashboardDigest = {
  digest: Digest | null;
  failed: boolean;
};

/** Dashboard paketinin tamamı; istemciye `initialData` olarak geçirilir. */
export type DashboardData = {
  /** `GET /portfolios/summaries` gövdesi; başarısızsa `null`. */
  summary: PortfolioSummaryResponse | null;
  /** Favori ticker listesi; `GET /favorites` başarısızsa boş dizi. */
  favorites: string[];
  /** Favoriler için tek toplu özet; favori yoksa veya hata varsa `null`. */
  companies: CompanySummaryResponse | null;
  /** Piyasa nabzı quote paketi; başarısızsa `null`. */
  pulse: EconomyQuoteBundle | null;
  /** Paylaşılan piyasa durumu; başarısızsa `null`. */
  status: MarketStatus | null;
  /** Güncel bülten; yok/hata ayrımı `failed` ile yapılır. */
  digest: DashboardDigest;
};

/** `GET /portfolios/summaries` — değerlemeli portföy listesi (B-10). */
export function fetchPortfolioSummaries(): Promise<PortfolioSummaryResponse | null> {
  return serverAuthApiFetch<PortfolioSummaryResponse>(portfolioSummariesServerPath());
}

/** `GET /favorites` — favori ticker listesi. */
export function fetchFavorites(): Promise<FavoritesResponse | null> {
  return serverAuthApiFetch<FavoritesResponse>("/api/v1/favorites");
}

/** `GET /companies/summary?tickers=` — favoriler için TEK toplu fiyat isteği. */
export function fetchFavoriteSummaries(
  tickers: readonly string[],
): Promise<CompanySummaryResponse | null> {
  if (tickers.length === 0) {
    return Promise.resolve(null);
  }
  return serverAuthApiFetch<CompanySummaryResponse>("/api/v1/companies/summary", {
    query: { tickers: tickers.join(","), limit: WATCHLIST_TICKER_LIMIT },
  });
}

/** `GET /economy/quotes?symbols=` — FX + metal tek istekte (P-02/P-05). */
export function fetchPulseQuotes(): Promise<EconomyQuoteBundle | null> {
  return serverAuthApiFetch<EconomyQuoteBundle>("/api/v1/economy/quotes", {
    query: { symbols: PULSE_SYMBOLS.join(",") },
  });
}

/**
 * `GET /digest` — yalnız güncel bülten (tek istek).
 *
 * Tazelik rozeti burada hesaplanmaz; `/digest` sayfasındaki `?at=` sorgusu
 * dashboard bütçesine eklenmez. `404` gerçek "bülten yok", diğer hatalar
 * "backend'e ulaşılamadı" olarak ayrılır.
 */
export async function fetchCurrentDigest(): Promise<DashboardDigest> {
  const result = await serverAuthApiFetchWithStatus<Digest>(digestServerPath());
  if (result.status >= 200 && result.status < 300 && result.data) {
    return { digest: result.data, failed: false };
  }
  return { digest: null, failed: result.status !== 404 };
}

/**
 * Paketin tamamını yükler.
 *
 * Beş bağımsız kaynak PARALEL çekilir; favori özeti favori listesine bağımlı
 * olduğundan yalnız o (ve favori varsa) ikinci turda alınır (N+1 yok, tek toplu
 * istek).
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  const [summary, favoritesResponse, status, pulse, digest] = await Promise.all([
    fetchPortfolioSummaries(),
    fetchFavorites(),
    fetchMarketStatus(),
    fetchPulseQuotes(),
    fetchCurrentDigest(),
  ]);

  const favorites = favoritesResponse?.favorites ?? [];
  const companies = favorites.length > 0 ? await fetchFavoriteSummaries(favorites) : null;

  return { summary, favorites, companies, pulse, status, digest };
}
