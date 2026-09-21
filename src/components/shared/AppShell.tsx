/**
 * Uygulama kabuğu (plan §3.1 ilke 4, §4, A-02, A-04, U-03, U-11, X-03).
 *
 * Sunucu bileşeni: tema çerezden okunur. Oturum `getSession()` ile çözülür;
 * access token çerezi YOKSA ağ çağrısı yapılmadan anonim kabul edilir
 * (`getSession` erken döner), çerez varsa backend `/profile` ile doğrulanır ve
 * `React.cache` sayesinde aynı istekteki sayfa/layout ile paylaşılır.
 *
 * Anonimde: sağda "Giriş"/"Kayıt" butonları; `CreditDisplay`, `AccountMenu` ve
 * `AnnouncementBell` gösterilmez; sunucuya kredi/duyuru isteği ATILMAZ. Kişisel
 * nav öğeleri `Sidebar`/`MobileNav` içinde kilitli görünür ve `/login?next=`
 * hedefine gider. Oturum bilgisi istemciye `SessionProvider` ile geçer.
 *
 * Topbar'da ayrı `LocaleSwitcher`/`ThemeSwitcher` YOK: tema/dil/çıkış artık
 * hesap menüsünde toplanmıştır (U-11).
 */
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SessionKeeper } from "@/components/auth/SessionKeeper";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { AccountMenu } from "@/components/shared/AccountMenu";
import { AnnouncementBell } from "@/components/shared/AnnouncementBell";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { CreditDisplay } from "@/components/shared/CreditDisplay";
import { MobileNav } from "@/components/shared/MobileNav";
import { Sidebar } from "@/components/shared/Sidebar";
import { buttonVariants } from "@/components/ui/button";
import { resolveTheme, THEME_COOKIE } from "@/i18n/config";
import { ANNOUNCEMENTS_SERVER_PATH } from "@/lib/announcements/api-paths";
import type { AnnouncementListResponse } from "@/lib/announcements/types";
import { serverAuthApiFetch } from "@/lib/api/server-auth";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { getAccessTokenExpiry, getSession } from "@/lib/auth/session";
import { creditsServerPath } from "@/lib/reports/api-paths";
import type { CreditsResponse } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

export async function AppShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const authenticated = session !== null;

  const [t, app, tp, cookieStore] = await Promise.all([
    getTranslations("common"),
    getTranslations("app"),
    getTranslations("public"),
    cookies(),
  ]);
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);

  // Kişiye özel veriler YALNIZ oturum varken çekilir; anonimde ağ çağrısı yok.
  const [credits, announcements] = authenticated
    ? await Promise.all([
        serverAuthApiFetch<CreditsResponse>(creditsServerPath()),
        serverAuthApiFetch<AnnouncementListResponse>(ANNOUNCEMENTS_SERVER_PATH),
      ])
    : [null, null];

  const accessToken = authenticated ? cookieStore.get(ACCESS_TOKEN_COOKIE)?.value : undefined;
  const expiresAt = accessToken ? getAccessTokenExpiry(accessToken) : null;

  return (
    <SessionProvider session={{ authenticated, user: session ?? null }}>
      <div className="flex min-h-dvh bg-background text-foreground">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-foreground shadow-pop transition-transform duration-150 ease-out focus:translate-y-0"
        >
          {t("skipToContent")}
        </a>
        <Sidebar authenticated={authenticated} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background px-4 md:px-6">
            <MobileNav authenticated={authenticated} />
            <span className="hidden text-sm font-semibold text-foreground sm:inline md:hidden">
              {app("name")}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <CommandPalette theme={theme} authenticated={authenticated} />
              {authenticated ? (
                <>
                  <AnnouncementBell initialAnnouncements={announcements ?? undefined} />
                  <CreditDisplay initialCredits={credits?.credits} />
                  <AccountMenu theme={theme} initialCredits={credits?.credits} />
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    {tp("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
                  >
                    {tp("nav.register")}
                  </Link>
                </>
              )}
            </div>
          </header>
          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
            {authenticated ? <SessionKeeper expiresAt={expiresAt} /> : null}
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
