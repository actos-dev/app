/**
 * Dinamik API yolları (Faz 3 / Birim 3.3).
 *
 * `src/types/generated.ts` OpenAPI yollarını yer tutucuyla taşır
 * (`/api/v1/favorites/{ticker}`); gerçek değerle doldurulmuş yol statik olarak
 * ifade edilemediği için `ApiPath`'e çevrim TEK noktada yapılır. Böylece her
 * çağrıda dağınık `as` cast'i oluşmaz.
 */
import type { ApiPath } from "@/lib/api/client";

function toApiPath(path: string): ApiPath {
  return path as ApiPath;
}

export function companyInfoPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/companies/info/${encodeURIComponent(ticker)}`);
}

export function priceHistoryPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/price/history/${encodeURIComponent(ticker)}`);
}

export function newsPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/news/${encodeURIComponent(ticker)}`);
}

export function economyHistoryPath(symbol: string): ApiPath {
  return toApiPath(`/api/v1/economy/history/${encodeURIComponent(symbol)}`);
}

export function favoritesTickerPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/favorites/${encodeURIComponent(ticker)}`);
}
