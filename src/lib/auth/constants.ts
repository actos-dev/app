/**
 * Auth/BFF runtime sabitleri (Faz 2 / Birim 2.1).
 *
 * Bilerek yan etkisiz ve framework'süz tutulur: hem Proxy (`src/proxy.ts`),
 * hem Route Handler (BFF), hem de sunucu bileşenleri bu modülü güvenle
 * içe alabilir. `next/headers` gibi istek API'leri burada KULLANILMAZ; aksi
 * halde Proxy paketine sızar.
 */

/** Backend'in access token çerezi (httpOnly, path=/; backend `auth.py:37-47`). */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Backend'in refresh token çerezi (httpOnly, path=/api/v1/auth). */
export const REFRESH_TOKEN_COOKIE = "refresh_token";

/** Refresh çerezinin backend'deki path kısıtı; temizlerken aynı path şart. */
export const REFRESH_TOKEN_PATH = "/api/v1/auth";

/**
 * Backend taban adresi (BFF proxy + sunucu tarafı oturum doğrulaması).
 *
 * `API_BASE_URL` yalnız sunucu tarafında okunur (NEXT_PUBLIC değildir);
 * varsayılan yerel geliştirme adresidir. Sondaki eğik çizgiler kırpılır ki
 * `${base}/api/v1/...` birleşimi çift çizgi üretmesin.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.API_BASE_URL?.trim();
  return (configured && configured.length > 0 ? configured : "http://localhost:7055").replace(
    /\/+$/,
    "",
  );
}
