/**
 * Statik güvenlik başlıkları (plan S-05, Faz 6).
 *
 * CSP istek başına nonce taşıdığı için burada DEĞİL, `src/proxy.ts` içinde
 * yazılır. Bu modül yalnız istekten bağımsız, her yanıta eklenebilen başlıkları
 * toplar ve `next.config.ts::headers()` tarafından kullanılır. Tek kaynak
 * olması, testin doğrudan bu çıktıyı doğrulamasını sağlar.
 */

/** `next.config.ts::headers()` çıktısındaki tek başlık. */
export type SecurityHeader = { key: string; value: string };

/**
 * Gereksiz tarayıcı API'leri kapatılır; uygulama bunların hiçbirini
 * kullanmadığı için izin listesi boştur (`feature=()`).
 */
const PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "browsing-topics=()",
  "payment=()",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
  "display-capture=()",
].join(", ");

/**
 * Tüm yollara uygulanan başlıklar. `Strict-Transport-Security` yalnız HTTPS'te
 * etkilidir; yerel http geliştirmesini bozmaz.
 *
 * Not: `X-Frame-Options: SAMEORIGIN` eski tarayıcı geri çekilmesidir; modern
 * tarayıcılarda CSP `frame-ancestors 'none'` (proxy) daha katı biçimde geçerlidir.
 */
export const SECURITY_HEADERS: readonly SecurityHeader[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

/** `next.config.ts::headers()` için kural listesi (kopya döner). */
export function securityHeaderRules(): Array<{ source: string; headers: SecurityHeader[] }> {
  return [{ source: "/(.*)", headers: SECURITY_HEADERS.map((header) => ({ ...header })) }];
}
