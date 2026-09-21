/**
 * Simülasyon API yolları (Faz 5 / Birim 5A.2).
 *
 * Statik yollar `/api/v1/simulations/*` üretilmiş `paths` anahtarlarıdır;
 * doğrudan `ApiPath`/`ServerApiPath` olarak yazılabilirler. Yalnız sembol ve
 * kimlik içeren dinamik yollar bir yardımcıyla kurulur ki çağrı yerlerinde
 * dağınık `as` cast'i oluşmasın (bkz. `lib/reports/api-paths.ts` deseni).
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

function toApiPath(path: string): ApiPath {
  return path as ApiPath;
}

function toServerPath(path: string): ServerApiPath {
  return path as ServerApiPath;
}

/** `GET /simulations/per-day-cost` — gün başına kredi maliyeti. */
export const SIMULATIONS_PER_DAY_COST_PATH: ApiPath = "/api/v1/simulations/per-day-cost";

/** `GET /simulations/history?limit=&offset=` — simülasyon geçmişi. */
export const SIMULATIONS_HISTORY_PATH: ApiPath = "/api/v1/simulations/history";

/** RSC için `GET /simulations/history`. */
export function simulationsHistoryServerPath(): ServerApiPath {
  return toServerPath("/api/v1/simulations/history");
}

/** RSC için `GET /credits`. */
export function simulationsCreditsServerPath(): ServerApiPath {
  return toServerPath("/api/v1/credits");
}

/** `GET /simulations/estimate-cost/{ticker}?days=` — tahmini maliyet. */
export function simulationEstimateCostPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/simulations/estimate-cost/${encodeURIComponent(ticker)}`);
}

/**
 * `GET /simulations/{ticker}?days=&bounds=&target=` — senkron Monte-Carlo.
 *
 * Kredi harcar ve 600 sn'ye kadar sürebilir (B-09 yok, iptal edilemez).
 */
export function simulationRunPath(ticker: string): ApiPath {
  return toApiPath(`/api/v1/simulations/${encodeURIComponent(ticker)}`);
}

/** `GET /simulations/history/{sim_id}` — tek simülasyon detayı. */
export function simulationDetailPath(id: number | string): ApiPath {
  return toApiPath(`/api/v1/simulations/history/${encodeURIComponent(String(id))}`);
}