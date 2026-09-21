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

/** Sunucu (RSC) için `GET /portfolios/{id}`. */
export function portfolioServerPath(id: string): ServerApiPath {
  return toServerPath(`/api/v1/portfolios/${encodeURIComponent(id)}`);
}

/** `POST /portfolios/{id}/duplicate` — portföyü çoğalt. */
export function portfolioDuplicatePath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/duplicate`);
}

/** `GET /portfolios/{id}/valuation` — güncel değerleme. */
export function portfolioValuationPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/valuation`);
}

/** Sunucu (RSC) için `GET /portfolios/{id}/valuation`. */
export function portfolioValuationServerPath(id: string): ServerApiPath {
  return toServerPath(`/api/v1/portfolios/${encodeURIComponent(id)}/valuation`);
}

/** `GET/POST /portfolios/{id}/transactions` — işlem geçmişi / yeni işlem. */
export function portfolioTransactionsPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/transactions`);
}

/** Sunucu (RSC) için `GET /portfolios/{id}/transactions`. */
export function portfolioTransactionsServerPath(id: string): ServerApiPath {
  return toServerPath(`/api/v1/portfolios/${encodeURIComponent(id)}/transactions`);
}

/** `PUT /portfolios/{id}/transactions/{tx_id}` — işlem düzeltme. */
export function portfolioTransactionPath(id: string, txId: string): ApiPath {
  return toApiPath(
    `/api/v1/portfolios/${encodeURIComponent(id)}/transactions/${encodeURIComponent(txId)}`,
  );
}

/** `DELETE /portfolios/{id}/transactions/undo` — son işlemi geri al. */
export function portfolioTransactionsUndoPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/transactions/undo`);
}

/** `GET /portfolios/{id}/export/csv` — işlemleri CSV indir. */
export function portfolioExportCsvPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/export/csv`);
}

/** `GET /portfolios/{id}/diversification` — varlık sınıfı/pozisyon dağılımı. */
export function portfolioDiversificationPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/diversification`);
}

/** `GET /portfolios/{id}/performers` — en iyi/en kötü pozisyonlar. */
export function portfolioPerformersPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/performers`);
}

/** `GET /portfolios/{id}/history` — portföy değeri zaman serisi. */
export function portfolioHistoryPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/history`);
}

/** `GET /portfolios/{id}/returns` — dönem getirileri. */
export function portfolioReturnsPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/returns`);
}

/** `GET /portfolios/{id}/risk` — volatilite, max drawdown, Sharpe. */
export function portfolioRiskPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/risk`);
}

/** `GET /portfolios/{id}/benchmark` — XU100 kıyası. */
export function portfolioBenchmarkPath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/benchmark`);
}

/** `GET /portfolios/{id}/performance` — işlem verimliliği. */
export function portfolioPerformancePath(id: string): ApiPath {
  return toApiPath(`/api/v1/portfolios/${encodeURIComponent(id)}/performance`);
}
