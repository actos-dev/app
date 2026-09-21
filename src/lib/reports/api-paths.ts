/**
 * Rapor ve kredi API yolları (Faz 5 / Birim 5A.1).
 *
 * Statik yollar `/api/v1/reports/*` ve `/api/v1/credits` üretilmiş `paths`
 * anahtarlarıdır; doğrudan `ApiPath`/`ServerApiPath` olarak yazılabilirler.
 * Yalnız kimlik içeren dinamik yol bir yardımcıyla kurulur ki çağrı yerlerinde
 * dağınık `as` cast'i oluşmasın (bkz. `lib/portfolio/api-paths.ts` deseni).
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

function toServerPath(path: string): ServerApiPath {
  return path as ServerApiPath;
}

/** `GET /reports/info` — rapor tipleri, açıklamalar ve tahmini maliyetler. */
export const REPORTS_INFO_PATH: ApiPath = "/api/v1/reports/info";

/** RSC için `GET /reports/info`. */
export function reportsInfoServerPath(): ServerApiPath {
  return toServerPath("/api/v1/reports/info");
}

/** `POST /reports/generate?ticker=&type=&purpose=` — senkron üretim. */
export const REPORTS_GENERATE_PATH: ApiPath = "/api/v1/reports/generate";

/** `GET /reports/history?sort=&order=` — rapor geçmişi. */
export const REPORTS_HISTORY_PATH: ApiPath = "/api/v1/reports/history";

/** `GET /reports/search?q=&limit=&offset=` — geçmişte arama. */
export const REPORTS_SEARCH_PATH: ApiPath = "/api/v1/reports/search";

/** `POST /reports/download?report_id=&ftype=` — md/docx/pdf indirme. */
export const REPORTS_DOWNLOAD_PATH: ApiPath = "/api/v1/reports/download";

/** `GET /credits` — toplam kredi bakiyesi (U-03). */
export const CREDITS_PATH: ApiPath = "/api/v1/credits";

/** `GET /reports/{id}` — tek rapor (istemci). */
export function reportPath(id: number | string): ApiPath {
  return `/api/v1/reports/${encodeURIComponent(String(id))}` as ApiPath;
}

/** RSC için `GET /reports/{id}`. */
export function reportServerPath(id: number | string): ServerApiPath {
  return toServerPath(`/api/v1/reports/${encodeURIComponent(String(id))}`);
}

/** RSC için `GET /reports/history`. */
export function reportsHistoryServerPath(): ServerApiPath {
  return toServerPath("/api/v1/reports/history");
}

/** RSC için `GET /credits`. */
export function creditsServerPath(): ServerApiPath {
  return toServerPath("/api/v1/credits");
}
