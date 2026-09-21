/**
 * Duyuru API yolları (Faz 5 / Birim 5B.3).
 *
 * Statik `/api/v1/announcements` ve `/api/v1/announcements/read` üretilmiş
 * `paths` anahtarlarıdır; kimlik içeren dinamik yol tek noktada kurulur.
 */
import type { ApiPath } from "@/lib/api/client";
import type { ServerApiPath } from "@/lib/api/server";

/** `GET /announcements` ve `POST /announcements`. */
export const ANNOUNCEMENTS_PATH: ApiPath = "/api/v1/announcements";

/** RSC için `GET /announcements` (topbar zili için ilk veri). */
export const ANNOUNCEMENTS_SERVER_PATH: ServerApiPath = "/api/v1/announcements";

/** `POST /announcements/read` — tüm duyuruları okundu işaretler. */
export const ANNOUNCEMENTS_READ_PATH: ApiPath = "/api/v1/announcements/read";

/** `PUT /announcements/{id}` ve `DELETE /announcements/{id}` (yalnız admin). */
export function announcementPath(announcementId: number): ApiPath {
  return `/api/v1/announcements/${encodeURIComponent(String(announcementId))}` as ApiPath;
}
