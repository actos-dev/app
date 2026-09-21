/**
 * Sunucu tarafı oturum yenileme yardımcısı (plan §2.3, S-12).
 *
 * Backend `POST /api/v1/auth/refresh` yalnız `refresh_token` çerezini okur ve
 * yanıtta iki `Set-Cookie` döner (access + refresh; rotasyon). Tarayıcı
 * yalnız Next origin'ini gördüğü için bu istek hem BFF proxy'sinden geçer
 * (`/api/v1/auth/refresh`) hem de sunucu içi çağrılarda (Proxy) doğrudan
 * backend'e gidebilir. İki kullanım da aynı normalizasyonu paylaşsın diye
 * `Set-Cookie` ayrıştırma burada tutulur.
 *
 * Ayrıştırıcılar saf; `refreshSession` dışında ağ erişimi yoktur.
 */
import {
  getApiBaseUrl,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

export type SameSite = "strict" | "lax" | "none";

/** `Set-Cookie` başlığının Next `cookies().set()` ile uygulanabilir hâli. */
export type NormalizedCookie = {
  name: string;
  value: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSite;
  /** Yoksa oturum çerezi; `0` silme anlamına gelir. */
  maxAge?: number;
};

export type RefreshResult =
  | { ok: true; cookies: NormalizedCookie[] }
  | { ok: false; status: number };

/** Tek bir `Set-Cookie` satırını ayrıştırır; zorunlu `name=value` yoksa `null`. */
export function parseSetCookie(raw: string): NormalizedCookie | null {
  const [pair = "", ...attributes] = raw.split(";");
  const separatorIndex = pair.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }
  const name = pair.slice(0, separatorIndex).trim();
  const value = pair.slice(separatorIndex + 1).trim();
  if (!name) {
    return null;
  }

  const cookie: NormalizedCookie = {
    name,
    value,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "lax",
  };

  for (const attribute of attributes) {
    const [rawKey = "", ...rawRest] = attribute.split("=");
    const key = rawKey.trim().toLowerCase();
    const attributeValue = rawRest.join("=").trim();
    if (key === "path") {
      cookie.path = attributeValue || "/";
    } else if (key === "httponly") {
      cookie.httpOnly = true;
    } else if (key === "secure") {
      cookie.secure = true;
    } else if (key === "samesite") {
      const normalized = attributeValue.toLowerCase();
      if (normalized === "strict" || normalized === "lax" || normalized === "none") {
        cookie.sameSite = normalized;
      }
    } else if (key === "max-age") {
      const parsed = Number.parseInt(attributeValue, 10);
      if (!Number.isNaN(parsed)) {
        cookie.maxAge = parsed;
      }
    }
  }

  return cookie;
}

export function normalizeSetCookies(raws: readonly string[]): NormalizedCookie[] {
  const cookies: NormalizedCookie[] = [];
  for (const raw of raws) {
    const parsed = parseSetCookie(raw);
    if (parsed) {
      cookies.push(parsed);
    }
  }
  return cookies;
}

/**
 * `Headers.getSetCookie()` Node 20+ (undici) ile çoklu `Set-Cookie`'yi dizi
 * olarak verir. Eski/güvenli olmayan bağlamlarda tek başlığa birleşmiş olabilir;
 * virgülle ayırırken `Expires` tarihindeki virgülü bölmemek için yalnız
 * ardından `name=` gelen virgülden bölünür.
 */
export function getSetCookieHeaders(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetter.getSetCookie === "function") {
    return withGetter.getSetCookie();
  }
  const combined = headers.get("set-cookie");
  if (!combined) {
    return [];
  }
  return combined.split(/,(?=\s*[!#$%&'*+\-.^_`|~A-Za-z0-9]+=)/);
}

/**
 * Backend'e refresh çereziyle POST atar; başarıda normalize edilmiş yeni
 * çerezleri döner. Ağ hatası `status: 0`, geçersiz/eksik çerez `ok: false`.
 */
export async function refreshSession(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
        "content-type": "application/json",
      },
      body: "{}",
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const cookies = normalizeSetCookies(getSetCookieHeaders(response.headers));
    if (cookies.length === 0) {
      return { ok: false, status: response.status };
    }
    return { ok: true, cookies };
  } catch {
    return { ok: false, status: 0 };
  }
}
