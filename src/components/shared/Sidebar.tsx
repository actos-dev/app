"use client";

/**
 * Sol navigasyon (plan §4, A-04, A-06).
 *
 * Masaüstünde sabit sidebar; mobilde aynı `NavLinks` gövdesi `MobileNav`
 * panelinde kullanılır. Aktif öğe `usePathname` ile bulunur ve
 * `aria-current="page"` ile işaretlenir; görsel vurgu `bg-surface-hover`.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { navGroups, primaryNavItem, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function navLinkClassName(active: boolean): string {
  return cn(
    "flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150 ease-out md:min-h-9",
    active
      ? "bg-surface-hover font-medium text-foreground"
      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
  );
}

/** Navigasyon bağlantıları; masaüstü ve mobil panel aynı listeyi paylaşır. */
export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const active = isActive(pathname, item);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
          className={navLinkClassName(active)}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span>{t(item.labelKey)}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={tCommon("mainNavigation")} className="flex flex-1 flex-col gap-6">
      <ul className="flex flex-col gap-1">{renderItem(primaryNavItem)}</ul>
      {navGroups.map((group) => {
        const items = group.items.filter(
          (item) => !item.devOnly || process.env.NODE_ENV !== "production",
        );
        if (items.length === 0) {
          return null;
        }
        return (
          <div key={group.id} className="flex flex-col gap-1">
            <h2 className="px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(`groups.${group.id}`)}
            </h2>
            <ul className="flex flex-col gap-1">{items.map(renderItem)}</ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const t = useTranslations("app");

  return (
    <aside className="hidden border-r border-border bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:gap-4 md:overflow-y-auto md:px-3 md:py-4">
      <div className="flex h-8 items-center px-2.5">
        <span className="text-sm font-semibold text-foreground">{t("name")}</span>
      </div>
      <NavLinks />
    </aside>
  );
}
