/**
 * KVKK çerez rızası altyapısı (plan S-04, Faz 6).
 *
 * Amaç: telemetry'nin yalnızca açık rıza sonrası çalışmasını sağlayan tek
 * kapı. Rıza `florence_consent` çerezinde tutulur; varsayılan **kapalıdır**
 * (çerez yoksa veya değer bozuksa hiçbir analitik olay gönderilmez).
 *
 * Tasarım notu: Bu modül bilinçli olarak yan etkisizdir — saf
 * `parseConsent`/`serializeConsent`/`readCookieValue` çözümleyicileri hem
 * istemcide hem de RSC tarafında (`cookies().get(...)` ile) kullanılabilir ve
 * Vitest'te doğrudan test edilebilir. Yalnızca `getConsent`/`setConsent`
 * tarayıcı API'lerine dokunur.
 *
 * Çerez ömrü 6 aydır, `SameSite=Lax`; `Secure` yalnız üretimde eklenir ki
 * yerel geliştirme (http) çalışsın. Rıza banner'ı ve tercih arayüzü ayrı
 * birimde (6.3) gelir; bu modül yalnız altyapıdır.
 */

/** Rıza çerezinin adı (istemci + RSC aynı sabiti kullanır). */
export const CONSENT_COOKIE = "florence_consent";

/** Çerez ömrü: 6 ay (saniye). */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/** Çerez şema sürümü; ileride alan eklenirse eski değerler güvenle çözülür. */
export const CONSENT_VERSION = 1;

/** Rıza durumu. Tek bir yetki türü var: `analytics`. */
export type ConsentState = {
  analytics: boolean;
};

/** Rıza yokluğunda geçerli durum: her şey kapalı. */
export const DEFAULT_CONSENT: ConsentState = { analytics: false };

/**
 * Ham çerez değerini güvenli çözer. `null`/boş/biçimsiz/geçersiz değerde
 * daima kapalı duruma düşer — asla açık rıza uydurmaz.
 */
export function parseConsent(raw: string | undefined | null): ConsentState {
  if (typeof raw !== "string" || raw.length === 0) {
    return DEFAULT_CONSENT;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const analytics = (parsed as { analytics?: unknown }).analytics;
      return { analytics: analytics === true };
    }
  } catch {
    // Bozuk JSON: kapalı varsayılan.
  }
  return DEFAULT_CONSENT;
}

/** Rıza durumunu çerez değerine serileştirir (saf). */
export function serializeConsent(value: ConsentState): string {
  return JSON.stringify({ v: CONSENT_VERSION, analytics: value.analytics === true });
}

/**
 * Ham `Cookie` başlığını (veya `document.cookie`) ayrıştırıp istenen anahtarın
 * değerini döner. Anahtar yoksa `undefined`. Değer URL-decode edilir (saf).
 */
export function readCookieValue(cookieString: string, name: string): string | undefined {
  for (const segment of cookieString.split(";")) {
    const separator = segment.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = segment.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }
    const value = segment.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return undefined;
}

/** Tarayıcıda rıza durumunu çerezten okur; sunucuda kapalı döner. */
export function getConsent(): ConsentState {
  if (typeof document === "undefined") {
    return DEFAULT_CONSENT;
  }
  return parseConsent(readCookieValue(document.cookie, CONSENT_COOKIE));
}

/**
 * Rıza durumunu çereze yazar. Yalnız tarayıcıda çağrılır; üretimde `Secure`
 * eklenir. `document.cookie` yazılamıyorsa (gizli mod vb.) sessizce geçer.
 */
export function setConsent(value: ConsentState): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const cookie = `${CONSENT_COOKIE}=${encodeURIComponent(serializeConsent(value))}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  try {
    document.cookie = cookie;
  } catch {
    // Rıza yazılamadı: kapalı kalır, hata kullanıcıya yansımaz.
  }
}

/** Analitik rızası açık mı? Telemetry'nin tek kapısı. */
export function hasAnalyticsConsent(): boolean {
  return getConsent().analytics;
}
