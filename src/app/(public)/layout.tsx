/**
 * `(public)` route group layout'u (plan §2.2, §4).
 *
 * URL'e yansımayan grup: landing, hakkında, iletişim, indir ve yasal sayfaları
 * ortak üst bar + alt bilgiyle sarar. Public sayfalar tema duyarlıdır; tema
 * çerezden sunucuda çözülür ve `PublicHeader`'a başlangıç değeri olarak geçer.
 */
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PublicFooter } from "@/components/marketing/PublicFooter";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { resolveTheme, THEME_COOKIE } from "@/i18n/config";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [t, cookieStore] = await Promise.all([getTranslations("common"), cookies()]);
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground shadow-pop transition-transform duration-150 ease-out focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <PublicHeader theme={theme} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
