/**
 * İmzasız JWT payload çözümü (B-03 fallback).
 *
 * Proxy'de backend `JWT_SECRET` paylaşılmadığı için imza DOĞRULANMAZ; yalnızca
 * yönlendirme kararı için `exp` okunur. Gerçek yetkilendirme backend'de kalır
 * (her API çağrısında imza + revocation kontrolü). Secret paylaşımı gelirse
 * (docs/adr/0007) bu modül yerel doğrulamayla genişletilir.
 *
 * Bu dosya bilerek framework'süz ve yan etkisizdir; Proxy de, sunucu
 * bileşeni de, Vitest de doğrudan içe alabilir.
 */

/** base64url → UTF-8 string (payload'lar ASCII JSON'dur). */
function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Token'ın `exp` (Unix saniye) değerini döner. Biçim bozuksa, payload JSON
 * değilse veya `exp` sayı değilse `null`.
 */
export function getAccessTokenExpiry(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const payloadPart = parts[1];
  if (!payloadPart) {
    return null;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(decodeBase64Url(payloadPart));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const exp = (payload as { exp?: unknown }).exp;
  return typeof exp === "number" && Number.isFinite(exp) ? exp : null;
}

/**
 * Token süresi dolmuş/okunamıyorsa `true`. İmza doğrulanmaz; bu yüzden
 * "geçerli" sonucu yalnız hızlı yol içindir, tek başına yetki kanıtı değildir.
 */
export function isAccessTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const expiry = getAccessTokenExpiry(token);
  if (expiry === null) {
    return true;
  }
  return expiry * 1000 <= nowMs;
}
