"use client";

/**
 * Public üst bar (plan §3.4, §4).
 *
 * Logo ana sayfaya döner; Hakkında / İletişim / İndir bağlantıları masaüstünde
 * görünür, mobilde Base UI Menu ile açılır. Sağda mevcut dil ve tema
 * değiştiricileriyle giriş/kayıt hedefleri durur. Tema, sunucu layout'undan
 * prop olarak gelir (çerez SSR'da okunur).
 */
import { Menu as MenuIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { buttonVariants } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import type { ThemeName } from "@/i18n/config";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/about", labelKey: "nav.about" },
  { href: "/contact", labelKey: "nav.contact" },
  { href: "/downloads", labelKey: "nav.downloads" },
] as const;

export function PublicHeader({ theme }: { theme: ThemeName }) {
  const t = useTranslations("public");
  const common = useTranslations("common");
  const app = useTranslations("app");

  const navItems = NAV_LINKS.map((link) => ({
    href: link.href,
    label: t(link.labelKey),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md text-base font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            F
          </span>
          {app("name")}
        </Link>

        <nav aria-label={common("mainNavigation")} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-3 lg:flex">
            <LocaleSwitcher />
            <ThemeSwitcher theme={theme} />
          </div>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}
          >
            {t("nav.login")}
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
            {t("nav.register")}
          </Link>
          <div className="md:hidden">
            <Menu
              align="end"
              aria-label={common("openMenu")}
              trigger={
                <button
                  type="button"
                  className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                  aria-label={common("openMenu")}
                >
                  <MenuIcon aria-hidden="true" className="size-5" />
                </button>
              }
              items={[
                ...navItems.map((item) => ({ label: item.label, href: item.href })),
                { label: t("nav.login"), href: "/login", separatorBefore: true },
                { label: t("nav.register"), href: "/register" },
              ]}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
