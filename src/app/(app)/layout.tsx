import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/AppShell";

/**
 * `(app)` route group layout'u (plan §2.3, M-03; 5C / X-02).
 *
 * URL'e yansımayan grup; tüm uygulama sayfalarına auth-FARKINDA `AppShell`
 * kabuğunu uygular. Faz 5C ile koruma buradan kaldırıldı: yalnız kişisel
 * sayfalar `(private)` alt grubuna taşındı ve oradaki layout + `src/proxy.ts`
 * tarafından korunur. Piyasa okuma sayfaları (`(public-market)`) anonime
 * açıktır; kabuk anonimde "Giriş/Kayıt" eylemlerini gösterir.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
