/**
 * Dış bağlantı güvenlik kapısı (Faz 2 / Birim 2.3b).
 *
 * Backend'den gelen adresler (ör. `contact.github`) asla doğrudan `href`'e
 * yazılmaz. Yalnız `http`/`https` şemaları geçer; `javascript:`, `data:`,
 * `vbscript:` gibi şemalar ve göreli/desteksiz değerler `null` döner.
 * Böylece içerik tabanlı bir XSS vektörü kapanır.
 */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  return url.toString();
}
