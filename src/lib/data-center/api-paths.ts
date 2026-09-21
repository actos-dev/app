/**
 * Veri merkezi API yolları (Faz 5 / Birim 5B.3).
 *
 * Statik `/api/v1/data/export` üretilmiş `paths` anahtarıdır; yıl dışındaki
 * değişken parçalar (export id, indirme token'ı) tek noktada kurulur.
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

/** `GET /data/export` — kullanıcının export listesi. */
export const DATA_EXPORT_PATH: ApiPath = "/api/v1/data/export";

/** RSC için `GET /data/export`. */
export const DATA_EXPORT_SERVER_PATH: ServerApiPath = "/api/v1/data/export";

/** `GET /data/export/{export_id}` — tek export durumu (poll hedefi). */
export function exportPath(exportId: number | string): ApiPath {
  return `/api/v1/data/export/${encodeURIComponent(String(exportId))}` as ApiPath;
}

/**
 * `GET /data/export/download/{token}` — PUBLIC indirme (auth yok).
 *
 * Token backend'in ürettiği opak `token_urlsafe` değeridir; yol parçası
 * olarak güvenli karakter kümesine doğrulanır (savunma amaçlı).
 */
export function exportDownloadPath(token: string): ApiPath {
  return `/api/v1/data/export/download/${encodeURIComponent(token)}` as ApiPath;
}
