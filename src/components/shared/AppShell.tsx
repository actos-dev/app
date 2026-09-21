/**
 * Uygulama kabuğu (plan §3.1 ilke 4, §4, A-02, A-04).
 *
 * Sunucu bileşeni: dil ve tema çerezden okunur (tema yalnızca `ThemeSwitcher`
 * başlangıç değeri için). Masaüstünde sabit sidebar + ince topbar; mobilde
 * `MobileNav` paneli. İlk odaklanabilir öğe "İçeriğe geç" bağlantısıdır ve
 * `main#main-content` hedefini işaret eder.
 */
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { resolveTheme, THEME_COOKIE } from "@/i18n/config";

export async function AppShell({ children }: { children: ReactNode }) {
  const [t, app, cookieStore] = await Promise.all([
    getTranslations("common"),
    getTranslations("app"),
    cookies(),
  ]);
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground shadow-pop transition-transform duration-150 ease-out focus:translate-y-0"
      >
        {t("skipToContent")}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4 md:px-6">
          <MobileNav />
          <span className="hidden text-sm font-semibold text-foreground sm:inline md:hidden">
            {app("name")}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeSwitcher theme={theme} />
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
