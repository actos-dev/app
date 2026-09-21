/**
 * Favori uçlarının tel formatı tipleri (Faz 3 / Birim 3.3, U-12).
 *
 * NEDEN ELLE: `GET /api/v1/favorites` backend'de `response_model` tanımlamaz,
 * bu yüzden `openapi.json` gövdeyi `unknown` üretir (bkz. `types/market.ts`
 * başındaki gerekçe). Şekil `backend/src/api/favorites.py` kaynağından
 * birebir çıkarıldı: `{"favorites": ["THYAO", ...]}`.
 */

/** `GET /api/v1/favorites` yanıtı. */
export type FavoritesResponse = {
  favorites: string[];
};
