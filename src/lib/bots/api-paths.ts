/**
 * Bot API yolları (Faz 5 / Birim 5B.3).
 *
 * Statik `/api/v1/bots` üretilmiş `paths` anahtarıdır; kimlik içeren dinamik
 * yol tek noktada kurulur ki çağrı yerlerinde dağınık `as` cast'i oluşmasın
 * (bkz. `lib/portfolio/api-paths.ts` deseni).
 */
import type { ApiPath } from "@/lib/api/client";

/** `GET /bots` ve `POST /bots`. */
export const BOTS_PATH: ApiPath = "/api/v1/bots";

/** `DELETE /bots/{bot_id}` — sahibin botunu siler. */
export function botPath(botId: number): ApiPath {
  return `/api/v1/bots/${encodeURIComponent(String(botId))}` as ApiPath;
}
