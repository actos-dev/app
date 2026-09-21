/**
 * `?next=` open-redirect savunması (plan S-02).
 *
 * Saf fonksiyonlar; hem Proxy, hem korumalı layout, hem de (ileride) login
 * formu aynı doğrulamayı kullanır. Yalnızca aynı-origin, çift eğik çizgi ve
 * ters eğik çizgi içermeyen mutlak yollar kabul edilir.
 */

/** Geçersiz veya eksik `next` değerinde dönülecek güvenli varsayılan. */
export const DEFAULT_NEXT_PATH = "/dashboard";

/**
 * `value` yalnız `/` ile başlıyorsa ve `//` / `\` içermiyorsa aynen döner;
 * aksi halde `/dashboard`. Protokol-relative (`//evil.com`), mutlak
 * (`http://evil`), ters eğik çizgi hilesi (`\\evil`, `/\evil`) ve boş değer
 * reddedilir.
 */
export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value) {
    return DEFAULT_NEXT_PATH;
  }
  if (!value.startsWith("/")) {
    return DEFAULT_NEXT_PATH;
  }
  if (value.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }
  if (value.includes("\\")) {
    return DEFAULT_NEXT_PATH;
  }
  return value;
}

/**
 * `/login?next=<sanitize edilmiş hedef>` üretir. `search` baştaki `?` ile ya
 * da olmadan verilebilir (`?a=1` / `a=1`).
 */
export function buildLoginRedirect(pathname: string, search = "") {
  const suffix = search.length > 0 && !search.startsWith("?") ? `?${search}` : search;
  const target = sanitizeNextPath(`${pathname}${suffix}`);
  return `/login?next=${encodeURIComponent(target)}`;
}
