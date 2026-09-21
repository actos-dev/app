/**
 * Veri merkezi (dışa aktarma) tel formatı tipleri (Faz 5 / Birim 5B.3).
 *
 * NEDEN ELLE: Backend export uçları `response_model` tanımlamadığından
 * `openapi.json` gövdeleri `unknown` üretir (bkz. `lib/reports/types.ts`
 * başındaki aynı gerekçe). Şekiller backend kaynağından birebir çıkarıldı:
 *   - `POST /data/export`                  → `exports.py::create_export`
 *   - `GET  /data/export`                  → `exports.py::_serialize`
 *   - `GET  /data/export/{id}`             → `exports.py::_serialize`
 *   - `GET  /data/export/download/{token}` → `exports.py::download_export`
 *
 * Durum değerleri DB CHECK kısıtından (`core/database.py::exports`) alınır;
 * `ready` ve `sent` ikisi de indirilebilir kabul edilir (kullanıcıya aynı
 * "Hazır" etiketi gösterilir).
 */

/** Backend `exports` tablosundaki gerçek durum değerleri. */
export const EXPORT_STATUSES = ["queued", "processing", "ready", "sent", "failed"] as const;

export type ExportStatus = (typeof EXPORT_STATUSES)[number];

/** İstenebilen dosya biçimleri (backend `ExportRequest.format` allowlist'i). */
export const EXPORT_FORMATS = ["csv", "json"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

/** Henüz sonuçlanmamış (poll edilmesi gereken) durumlar. */
export function isActiveExportStatus(status: ExportStatus | undefined): boolean {
  return status === "queued" || status === "processing";
}

/** `GET /data/export` ve `GET /data/export/{id}` yanıtı (backend `_serialize`). */
export type ExportJob = {
  id: number;
  year: number;
  format: ExportFormat;
  status: ExportStatus;
  created_at: string | null;
  updated_at: string | null;
  row_count: number | null;
  size_bytes: number | null;
  downloaded_count: number;
  expires_at: string | null;
  error: string | null;
  /** `status` ready/sent ve `expires_at` gelecekteyse true. */
  downloadable: boolean;
  /** `/api/v1/data/export/download/{token}` veya indirilemezse `null`. */
  download_url: string | null;
};

/** `POST /data/export` istek gövdesi (backend `ExportRequest`). */
export type ExportRequestInput = {
  year: number;
  format: ExportFormat;
};

/** `POST /data/export` yanıtı (202). */
export type ExportCreateResponse = {
  export_id: number;
  status: ExportStatus;
};
