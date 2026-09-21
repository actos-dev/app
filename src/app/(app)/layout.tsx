import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/AppShell";

/**
 * `(app)` route group layout'u (plan §4): URL'e yansımayan grup; tüm korumalı
 * uygulama sayfalarına `AppShell` kabuğunu uygular. Auth koruması Faz 2'de
 * middleware ile eklenecek.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
