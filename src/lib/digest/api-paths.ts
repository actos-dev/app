/**
 * Bülten API yolu (Faz 5 / Birim 5A.3, U-08).
 *
 * `GET /api/v1/digest` tek uçtur; çözüm sırası sorgu parametreleriyle
 * belirlenir (`date+slot` → tek, `date` → o günün dizisi, `at` → pencere,
 * boş → güncel). Bu yüzden ayrı yol sabitleri yerine tek sabit + sorgu
 * parametreleri kullanılır.
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

/** `GET /digest` — güncel/arşiv bülteni (bkz. backend `api/digest.py`). */
export const DIGEST_PATH: ApiPath = "/api/v1/digest";

/** RSC için `GET /digest`. */
export function digestServerPath(): ServerApiPath {
  return "/api/v1/digest" as ServerApiPath;
}
