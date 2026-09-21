/**
 * Portföy uçlarının tel formatı tipleri (Faz 4 / Birim 4.1).
 *
 * NEDEN ELLE: Backend portföy uçları `response_model` tanımlamaz; bu yüzden
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `types/market.ts` başındaki
 * gerekçe). Şekiller backend kaynağından birebir çıkarıldı:
 *   - `GET /portfolios/summaries` → `docs/backend-requests.md` B-10 sözleşmesi
 *   - `GET /portfolios`           → `backend/src/services/portfolio.py::Portfolio`
 *
 * Backend `response_model` ekleyip `npm run gen:api` koşulduğunda bu dosya
 * silinip `generated.ts` tipleri kullanılmalıdır.
 */

/**
 * `GET /api/v1/portfolios/summaries` tek portföy özeti (B-10).
 *
 * Boş portföyde backend `current_value = cost_basis` ve `position_count = 0`
 * döner. Değerleme alanları backend geçici olarak veremezse `null` gelebilir;
 * UI "—" gösterir.
 */
export type PortfolioSummary = {
  id: string;
  name: string;
  /** ISO para birimi kodu (ör. `TRY`). */
  currency: string;
  created_at: string;
  current_value: number | null;
  cost_basis: number | null;
  daily_change_pct: number | null;
  total_return_pct: number | null;
  position_count: number;
  /** Değerlemenin hesaplandığı an (ISO-8601); bilinmiyorsa `null`. */
  as_of: string | null;
};

/** `GET /api/v1/portfolios/summaries` yanıtı. */
export type PortfolioSummaryResponse = {
  items: PortfolioSummary[];
};

/**
 * `GET /api/v1/portfolios` içindeki portföy metadata'sı.
 *
 * Fallback yolu yalnız bu bloğu kullanır; işlem gövdeleri (transaction listesi)
 * liste ekranında gerekmez, portföy başına ek istek atılmaz (B-10 N+1).
 */
export type PortfolioMetadata = {
  id: string;
  user_id: number;
  name: string;
  initial_balance: number;
  balance: number;
  created_at: string;
  updated_at: string;
};

/** `GET /api/v1/portfolios` tek portföy kaydı (backend `Portfolio` modeli). */
export type Portfolio = {
  metadata: PortfolioMetadata;
  transactions: PortfolioTransaction[];
};

/** Portföy işlemi (fallback listesinde gövde taşınır; detay 4.2'de kullanılır). */
export type PortfolioTransaction = {
  id: string;
  ticker: string;
  /** `BUY` | `SELL`. */
  type: string;
  quantity: number;
  price: number;
  commission: number;
  total: number;
  date: string;
};
