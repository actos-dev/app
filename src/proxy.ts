/**
 * Proxy — korumalı rotalar için ön yönlendirme (plan M-03, B-03 fallback, S-12).
 *
 * Next 16'da `middleware.ts` `proxy.ts` olarak yeniden adlandırıldı ve varsayılan
 * runtime Node.js oldu (bkz. `node_modules/next/dist/docs/.../file-conventions/proxy.md`).
 * Bu yüzden dosya `src/proxy.ts`, dışa aktarılan fonksiyon `proxy`.
 *
 * Yetkilendirme backend'de kalır: burada yalnızca hızlı yönlendirme kararı
 * verilir. `JWT_SECRET` paylaşılmadığı için imza DOĞRULANMAZ; access token'ın
 * `exp` değeri imzasız okunur. Süresi dolmuş/eksikse ve refresh çerezi varsa
 * backend üzerinden yenilenir, başarısızsa çerezler temizlenip
 * `/login?next=...`'e gidilir.
 *
 * Not: refresh çerezini tarayıcı yalnız `path=/api/v1/auth` altına gönderir;
 * bu yüzden sayfa isteklerinde (`/dashboard` vb.) genellikle GÖRÜNMEZ ve
 * yenileme BFF katmanına düşer. Refresh çerezi bir gün genişletilirse bu
 * mantık değişmeden çalışır.
 */
import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_PATH,
} from "@/lib/auth/constants";
import { isAccessTokenExpired } from "@/lib/auth/jwt";
import { buildLoginRedirect } from "@/lib/auth/next-path";
import { refreshSession, type NormalizedCookie } from "@/lib/auth/refresh";

/** Korumalı rotalar; `/api/v1` (BFF) bilinçli olarak hariç. */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/markets/:path*",
    "/watchlist/:path*",
    "/portfolio/:path*",
    "/research/:path*",
    "/digest/:path*",
    "/data/:path*",
    "/profile/:path*",
    "/kitchen-sink/:path*",
  ],
};

/**
 * Sunucu bileşenlerinin (özellikle savunma amaçlı `(app)/layout.tsx`) login
 * hedefini kurabilmesi için pathname + search'ü istek başlığına yazar.
 */
function withForwardedLocation(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  headers.set("x-search", request.nextUrl.search);
  return headers;
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
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  // Hızlı yol: süresi dolmamış access token (imza backend'de doğrulanır).
  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return NextResponse.next({ request: { headers: withForwardedLocation(request) } });
  }

  if (refreshToken) {
    const refreshed = await refreshSession(refreshToken);
    if (refreshed.ok) {
      const headers = withForwardedLocation(request);
      headers.set("cookie", applyRefreshedCookies(request.headers.get("cookie"), refreshed.cookies));
      const response = NextResponse.next({ request: { headers } });
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
  clearAuthCookies(response);
  return response;
}
