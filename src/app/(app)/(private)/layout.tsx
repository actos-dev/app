import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";

import { buildLoginRedirect } from "@/lib/auth/next-path";
import { getSession } from "@/lib/auth/session";

/**
 * `(private)` route group layout'u (Faz 5C / Birim 5C.2a, X-02).
 *
 * Kişisel sayfalar (watchlist, portfolio, research, data, profile,
 * kitchen-sink) URL'e yansımayan bu grupta toplanır ve burada korunur.
 * Birincil kapı `src/proxy.ts`'tir; buradaki `getSession()` ikinci savunma
 * katmanıdır: access token geçerli görünse bile backend `/profile` 401/404
 * dönerse (parola değişimi, donma, silinmiş hesap) kullanıcı login'e gider.
 * Proxy `x-pathname`/`x-search` başlıklarını bırakır; olmazsa `/dashboard`.
 */
export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") ?? "/dashboard";
    const search = headerList.get("x-search") ?? "";
    // typedRoutes dinamik query string'i statik ifade edemediğinden tek cast:
    // hedef her zaman `/login?next=...` deseninde kalır.
    redirect(buildLoginRedirect(pathname, search) as Route);
  }

  return <>{children}</>;
}
