/**
 * `/watchlist` sunucu veri yükleyicileri (Faz 3 / Birim 3.4, P-02).
 *
 * Akış: önce `GET /favorites` ile ticker listesi alınır, ardından TEK toplu
 * `/companies/summary?tickers=A,B,C` isteğiyle fiyat/değişim çekilir. Böylece
 * satır başına istek (N+1) oluşmaz. `GET /favorites` başarısızsa `failed`
 * işaretlenir; sayfa boş durumdan ayırt edip hata gösterir.
 *
 * Tüm çağrılar `serverAuthApiFetch` ile gelen isteğin çerezi iletilerek yapılır.
 */
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { WATCHLIST_TICKER_LIMIT } from "@/lib/markets/params";
import type { FavoritesResponse } from "@/types/favorites";
import type { CompanySummaryResponse } from "@/types/market";

export type WatchlistData = {
  /** Favori ticker'ları (sıralama sunucudan gelir). */
  favorites: string[];
  /** Tek toplu fiyat yanıtı; favori yoksa veya istek başarısızsa `null`. */
  summary: CompanySummaryResponse | null;
  /** `GET /favorites` başarısız mı? */
  failed: boolean;
};

/** Favori ticker listesi. */
export function fetchFavorites(): Promise<FavoritesResponse | null> {
  return serverAuthApiFetch<FavoritesResponse>("/api/v1/favorites");
}

/** Tüm favoriler için tek toplu fiyat isteği. */
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

/** Sayfanın tek seferde ihtiyaç duyduğu tüm veri. */
export async function fetchWatchlistData(): Promise<WatchlistData> {
  const response = await fetchFavorites();
  if (response === null) {
    return { favorites: [], summary: null, failed: true };
  }
  const favorites = response.favorites;
  const summary = await fetchFavoriteSummaries(favorites);
  return { favorites, summary, failed: false };
}
