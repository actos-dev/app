/**
 * Danışman API yolları (Faz 5 / Birim 5A.2).
 *
 * İki uç da `POST`'tur ve `openapi.json`'daki üretilmiş statik `paths`
 * anahtarlarıdır; doğrudan `ApiPath` olarak yazılabilirler.
 */
import type { ApiPath } from "@/lib/api/client";

/** `POST /stocks/fit` — profil → hisse önerisi. */
export const ADVISOR_FIT_PATH: ApiPath = "/api/v1/stocks/fit";

/** `POST /portfolio/profile` — varlık listesi → ortak profil + benzer hisseler. */
export const ADVISOR_PORTFOLIO_PROFILE_PATH: ApiPath = "/api/v1/portfolio/profile";