/**
 * Proxy — korumalı rotalar için ön yönlendirme + istek başına CSP nonce
 * (plan M-03, B-03 fallback, S-01/S-05/S-12, Faz 6).
 *
 * Next 16'da `middleware.ts` `proxy.ts` olarak yeniden adlandırıldı ve varsayılan
 * runtime Node.js oldu (bkz. `node_modules/next/dist/docs/.../file-conventions/proxy.md`).
 * Bu yüzden dosya `src/proxy.ts`, dışa aktarılan fonksiyon `proxy`.
 *
 * İki sorumluluk:
 *   1) **Güvenlik (S-05):** Her istek için yeni bir nonce üretilir; CSP hem
 *      istek başlığına (Next render sırasında nonce'ı buradan çıkarır) hem de
 *      yanıt başlığına yazılır.
 *   2) **Oturum kapısı:** Yalnız kişisel rotalar (`isProtectedPath`) için hızlı
 *      yönlendirme kararı verilir. Yetkilendirme backend'de kalır; `JWT_SECRET`
 *      paylaşılmadığı için imza DOĞRULANMAZ, access token'ın `exp` değeri
 *      imzasız okunur. Süresi dolmuş/eksikse ve refresh çerezi varsa backend
 *      üzerinden yenilenir, başarısızsa çerezler temizlenip `/login?next=...`.
 *
 * Not: refresh çerezini tarayıcı yalnız `path=/api/v1/auth` altına gönderir;
 * bu yüzden sayfa isteklerinde (`/dashboard` vb.) genellikle GÖRÜNMEZ ve
 * yenileme BFF katmanına düşer. Refresh çerezi bir gün genişletilirse bu
 * mantık değişmeden çalışır.
 */
import { NextResponse, type NextRequest } from "next/server";

import { createCspContext, CSP_HEADER, NONCE_HEADER } from "@/config/csp";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_PATH,
} from "@/lib/auth/constants";
import { isAccessTokenExpired } from "@/lib/auth/jwt";
import { buildLoginRedirect } from "@/lib/auth/next-path";
import { refreshSession, type NormalizedCookie } from "@/lib/auth/refresh";

/**
 * Proxy yalnız belge (HTML) isteklerinde çalışır: `/api` (BFF), `_next`
 * varlıkları ve noktalı dosyalar (robots.txt, sitemap.xml, ikonlar) hariç.
 * Next dokümanının önerdiği gibi prefetch istekleri de atlanır.
 *
 * Not: `source` Next tarafından derleme anında statik olarak ayrıştırıldığı
 * için düz string literal olmak zorundadır. Olumsuz ileri-bakış bir gruba
 * alınmıştır; böylece `!` bir harfin başında gelmez ve tasarım token kapısı
 * yanlış pozitif üretmez.
 */
export const config = {
  matcher: [
    {
      source: "/((?!(?:api|_next|.*\\..*)).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

/**
 * Korunan YALNIZ kişisel rota önekleri; `/api/v1` (BFF) ve piyasa okuma
 * rotaları hariç.
 *
 * Faz 5C / X-02: piyasa okuma rotaları (`/markets`, `/symbol`, `/digest`) ve
 * guest dashboard'a hazırlık için `/dashboard` bu listeden ÇIKARILDI; bunlar
 * anonime açıktır ve `serverApiFetch` (çerezsiz) ile veri çeker.
 */
export const PROTECTED_PATH_PREFIXES = [
  "/watchlist",
  "/portfolio",
  "/research",
  "/data",
  "/profile",
  "/kitchen-sink",
] as const;

/** Verilen pathname kişisel (korumalı) bir rota mı? (saf; test edilebilir). */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * Sunucu bileşenlerinin (özellikle savunma amaçlı `(app)/(private)/layout.tsx`)
 * login hedefini kurabilmesi ve nonce'u okuyabilmesi için istek başlıklarını
 * hazırlar.
 */
function buildRequestHeaders(request: NextRequest, nonce: string, csp: string): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  headers.set("x-search", request.nextUrl.search);
  headers.set(NONCE_HEADER, nonce);
  headers.set(CSP_HEADER, csp);
  return headers;
}

/** Nonce/CSP'li geçiş yanıtı üretir; CSP yanıt başlığına da yazılır. */
function nextWithSecurity(
  request: NextRequest,
  nonce: string,
  csp: string,
  cookieHeader?: string,
): NextResponse {
  const headers = buildRequestHeaders(request, nonce, csp);
  if (cookieHeader !== undefined) {
    headers.set("cookie", cookieHeader);
  }
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(CSP_HEADER, csp);
  return response;
}

/** Yenilenen çerez değerlerini mevcut `Cookie` istek başlığına işler. */
function applyRefreshedCookies(
  cookieHeader: string | null,
  cookies: readonly NormalizedCookie[],
): string {
  const values = new Map<string, string>();
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const index = part.indexOf("=");
      if (index > 0) {
        values.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
      }
    }
  }
  for (const cookie of cookies) {
    values.set(cookie.name, cookie.value);
  }
  return Array.from(values, ([name, value]) => `${name}=${value}`).join("; ");
}

/** Başarısız yenilemede access + refresh çerezlerini (doğru path'lerle) siler. */
function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({ name: ACCESS_TOKEN_COOKIE, value: "", path: "/", maxAge: 0 });
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    path: REFRESH_TOKEN_PATH,
    maxAge: 0,
  });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { nonce, csp } = createCspContext();
  const { pathname, search } = request.nextUrl;

  // Piyasa/public sayfaları: yalnız güvenlik başlıkları + nonce; oturum işi yok.
  if (!isProtectedPath(pathname)) {
    return nextWithSecurity(request, nonce, csp);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // Hızlı yol: süresi dolmamış access token (imza backend'de doğrulanır).
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return nextWithSecurity(request, nonce, csp);
  }

  if (refreshToken) {
    const refreshed = await refreshSession(refreshToken);
    if (refreshed.ok) {
      const cookieHeader = applyRefreshedCookies(
        request.headers.get("cookie"),
        refreshed.cookies,
      );
      const response = nextWithSecurity(request, nonce, csp, cookieHeader);
      for (const cookie of refreshed.cookies) {
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          ...(cookie.maxAge !== undefined ? { maxAge: cookie.maxAge } : {}),
        });
      }
      return response;
    }
  }

  const response = NextResponse.redirect(
    new URL(buildLoginRedirect(pathname, search), request.url),
  );
  response.headers.set(CSP_HEADER, csp);
  clearAuthCookies(response);
  return response;
}
