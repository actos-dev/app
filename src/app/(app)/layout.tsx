import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/AppShell";
import { buildLoginRedirect } from "@/lib/auth/next-path";
import { getSession } from "@/lib/auth/session";

/**
 * `(app)` route group layout'u (plan §2.3, M-03): URL'e yansımayan grup; tüm
 * korumalı sayfalara `AppShell` kabuğunu uygular.
 *
 * Birincil kapı `src/proxy.ts`'tir; buradaki `getSession()` ikinci savunma
 * katmanıdır: access token geçerli görünse bile backend `/profile` 401/404
 * dönerse (parola değişimi, donma, silinmiş hesap) kullanıcı login'e gider.
 * Proxy `x-pathname`/`x-search` başlıklarını bırakır; olmazsa `/dashboard`.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") ?? "/dashboard";
    const search = headerList.get("x-search") ?? "";
    // typedRoutes, dinamik query string'i statik olarak ifade edemediğinden
    // tek zorunlu cast: hedef her zaman `/login?next=...` deseninde kalır.
    redirect(buildLoginRedirect(pathname, search) as Route);
  }

  return <AppShell>{children}</AppShell>;
}
