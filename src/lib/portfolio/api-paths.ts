/**
 * Portföy API yolları (Faz 4 / Birim 4.1).
 *
 * `/api/v1/portfolios/summaries` (B-10) backend deploy'u tamamlanana kadar
 * `openapi.json`'da YOK; `/portfolios/{id}` ise yer tutucuyla taşınır. Gerçek
 * değerle doldurulmuş yol statik olarak ifade edilemediğinden çevrim TEK
 * noktada yapılır (bkz. `lib/markets/api-paths.ts` deseni); çağrı yerlerinde
 * dağınık `as` cast'i oluşmaz. Backend şemayı yayınlayınca `gen:api` sonrası
 * bu yardımcılar kaldırılabilir.
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

/** `GET /api/v1/portfolios` — ham liste (hem istemci hem sunucu yolu geçerli). */
export const PORTFOLIOS_PATH: ApiPath = "/api/v1/portfolios";

const PORTFOLIO_SUMMARIES_PATH = "/api/v1/portfolios/summaries";

function toApiPath(path: string): ApiPath {
  return path as ApiPath;
}

function toServerPath(path: string): ServerApiPath {
  return path as ServerApiPath;
}

/** İstemci için `GET /portfolios/summaries` (B-10). */
export function portfolioSummariesPath(): ApiPath {
  return toApiPath(PORTFOLIO_SUMMARIES_PATH);
}

/** Sunucu (RSC) için `GET /portfolios/summaries` (B-10). */
export function portfolioSummariesServerPath(): ServerApiPath {
  return toServerPath(PORTFOLIO_SUMMARIES_PATH);
}

/** `GET /portfolios/{id}` — tek portföy. */
export function portfolioPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}`);
}

/** `POST /portfolios/{id}/duplicate` — portföyü çoğalt. */
export function portfolioDuplicatePath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/duplicate`);
}

/** `GET /portfolios/{id}/valuation` — güncel değerleme. */
export function portfolioValuationPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/valuation`);
}

/** `GET /portfolios/{id}/transactions` — işlem geçmişi. */
export function portfolioTransactionsPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/transactions`);
}
