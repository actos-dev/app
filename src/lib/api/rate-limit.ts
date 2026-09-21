/**
 * 429 / `Retry-After` yardımcıları (plan X-07, S-11, B-14).
 *
 * Public okuma uçları IP bazlı limitlenir (backend B-17). Sunucu bileşenleri
 * `429` aldığında kullanıcıya "çok fazla istek" uyarısı gösterilir; sunucu
 * `Retry-After` verdiyse bekleme süresi de yazılır. Bu modül saf tutulur:
 * `next/headers` veya ağ erişimi yoktur, bu yüzden sunucu/istemci/Proxy
 * ayrımı olmadan test edilebilir.
 */

/** Durum kodunu ve `Retry-After` değerini taşıyan asgari sonuç şekli. */
export type RateLimitResult = {
  status: number;
  retryAfter: number | null;
};

/** Bir sayfanın toplu limit durumu; uyarının gösterilip gösterilmeyeceğini belirler. */
export type RateLimitInfo = {
  limited: boolean;
  retryAfter: number | null;
};

/**
 * `Retry-After` başlığını saniyeye çevirir.
 *
 * Başlık iki biçimde olabilir (RFC 9110): delta-saniye (`"30"`) veya HTTP
 * tarihi (`"Wed, 21 Oct 2026 07:28:00 GMT"`). İkisi de desteklenir; geçersiz
 * değerde `null` döner. Geçmiş tarihler `0`'a indirgenir.
 */
export function parseRetryAfter(header: string | null): number | null {
  if (!header) {
    return null;
  }
  const value = header.trim();
  if (value.length === 0) {
    return null;
  }
  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }
  const delta = Math.ceil((timestamp - Date.now()) / 1000);
  return delta > 0 ? delta : 0;
}

/**
 * Paralel isteklerin sonuçlarından tek bir limit durumu üretir.
 *
 * Herhangi biri `429` ise `limited` true olur; `Retry-After` veren sonuçların
 * en büyüğü seçilir (en temkinli bekleme). Hiçbiri limitli değilse süre de
 * `null` kalır.
 */
export function collectRateLimit(results: readonly RateLimitResult[]): RateLimitInfo {
  let limited = false;
  let retryAfter: number | null = null;

  for (const result of results) {
    if (result.status !== 429) {
      continue;
    }
    limited = true;
    if (result.retryAfter !== null) {
      retryAfter = retryAfter === null ? result.retryAfter : Math.max(retryAfter, result.retryAfter);
    }
  }

  return { limited, retryAfter };
}
