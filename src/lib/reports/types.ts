/**
 * Rapor uçlarının tel formatı tipleri (Faz 5 / Birim 5A.1).
 *
 * NEDEN ELLE: Backend rapor uçlarının çoğu `response_model` tanımlamaz; bu
 * yüzden `openapi.json` gövdeleri `unknown` üretir (bkz. `types/market.ts` ve
 * `lib/portfolio/types.ts` başındaki aynı gerekçe). Şekiller backend
 * kaynağından birebir çıkarıldı:
 *   - `GET  /reports/info`     → `backend/src/api/reports.py::report_info`
 *   - `POST /reports/generate` → `backend/src/api/reports.py::generate_report_endpoint`
 *   - `GET  /reports/{id}`     → `backend/src/api/reports.py::get_single_report`
 *   - `GET  /reports/history`  → `ReportHistoryItem` (üretilmiş şema, aşağıda)
 *   - `GET  /credits`          → `backend/src/api/auth.py::get_credits_endpoint`
 *
 * `/reports/history` dışındaki gövdeler `response_model` kazanıp `npm run
 * gen:api` koşulduğunda elle yazılan tipler `generated.ts` lehine silinmelidir.
 * `ReportHistoryItem` zaten üretilmiş şemadan alınır (tek kaynak ilkesi).
 */
import type { components } from "@/types/generated";

/** İstemciden istenebilen rapor tipleri (backend allowlist'i). */
export const REPORT_TYPES = ["quick_report", "deep_report"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

/** `GET /reports/history` ve `GET /reports/search` satırı (üretilmiş şema). */
export type ReportHistoryItem = components["schemas"]["ReportHistoryItem"];

/** `/reports/info` tek rapor tipi tanımı. */
export type ReportInfoItem = {
  type: ReportType;
  name_en: string;
  name_tr: string;
  description: string;
  description_tr: string;
  /** Rapor tipinin tahmini kredi maliyeti (backend `_compute_cost`). */
  est_cost: number;
};

/** `GET /reports/info` yanıtı (fiyatlandırma sihirbazı buradan beslenir). */
export type ReportInfo = {
  quick_report: ReportInfoItem;
  deep_report: ReportInfoItem;
  token_cost_per_1k: number;
};

/** LLM token kullanımı; backend her raporda `{prompt, completion, total}` yazar. */
export type ReportTokenUsage = {
  prompt?: number;
  completion?: number;
  total?: number;
};

/**
 * Rapor kaynağı duyarlılığı (backend `SentimentItem`).
 *
 * LLM çıktısı olduğundan alanlar eksik gelebilir; UI eksik alanı zarifçe atlar.
 */
export type ReportSentiment = {
  sentiment?: string;
  url?: string;
  reasoning?: string;
};

/** `GET /reports/{id}` yanıtı. */
export type ReportDetail = {
  success: boolean;
  report_id: number;
  about: string;
  type: string;
  title: string;
  token_usage: ReportTokenUsage | null;
  credits_spend: number | null;
  purpose: string | null;
  report: string;
  sentiments: ReportSentiment[];
  created_at: string;
};

/**
 * `POST /reports/generate` yanıtı (senkron üretimin tam gövdesi).
 *
 * Üretim yanıtında maliyet her zaman hesaplanmış bir sayıdır; detay ucundaki
 * `null` olasılığı burada daraltılır.
 */
export type GenerateReportResponse = Omit<ReportDetail, "credits_spend"> & {
  credits_spend: number;
  remaining_credits: number;
};

/** `GET /credits` yanıtı. */
export type CreditsResponse = {
  credits: number;
};
