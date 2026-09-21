/**
 * Piyasa bülteni (digest) tel formatı tipleri (Faz 5 / Birim 5A.3, U-08).
 *
 * NEDEN ELLE: Backend `GET /digest` uç noktası bir `response_model`
 * tanımlamaz; bu yüzden `openapi.json` gövdesi `unknown` üretir (bkz.
 * `types/market.ts` ve `lib/reports/types.ts` başındaki aynı gerekçe). Şekil
 * backend kaynağından birebir çıkarıldı:
 *   - `backend/src/services/digest/models.py::Digest` / `DigestSection`
 *   - `backend/src/api/digest.py::read_digest` (çözüm sırası)
 *   - `backend/src/services/digest/reads.py::_DIGEST_COLUMNS`
 *
 * Backend uç noktası bir gün `response_model` kazanıp `npm run gen:api`
 * koşulduğunda bu elle yazılan tipler `generated.ts` lehine silinmelidir.
 */

/** Bülten slotları; backend `Literal["morning", "noon", "evening"]` ile aynı. */
export const DIGEST_SLOTS = ["morning", "noon", "evening"] as const;

export type DigestSlot = (typeof DIGEST_SLOTS)[number];

/** Tek bülten bölümü (`models.py::DigestSection`). */
export type DigestSection = {
  heading: string;
  body: string;
};

/**
 * `GET /digest` yanıtı (`models.py::Digest`).
 *
 * `content` ve bölüm gövdeleri AI üretimi Markdown'dır; sanitize edilerek
 * render edilir (S-03). `metadata` backend'in serbest bıraktığı ek bilgidir
 * (ör. `slot`, `generated_at`); UI zorunlu alan saymaz.
 */
export type Digest = {
  id: string;
  date: string;
  slot: DigestSlot;
  title: string;
  content: string;
  sections: DigestSection[];
  metadata: Record<string, unknown>;
  language: string;
  created_at: string;
};
