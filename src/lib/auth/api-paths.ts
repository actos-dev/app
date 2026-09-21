/**
 * Auth API yolları (Faz 5 / Birim 5A.3, U-11).
 *
 * Statik yol `/api/v1/auth/logout` üretilmiş `paths` anahtarıdır; doğrudan
 * `ApiPath` olarak yazılabilir.
 */
import type { ApiPath } from "@/lib/api/client";

/** `POST /auth/logout` — sunucu çerezlerini temizler (A3). */
export const LOGOUT_PATH: ApiPath = "/api/v1/auth/logout";
