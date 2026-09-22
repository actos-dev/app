"use client";

/**
 * Masaüstü üst navigasyonu (plan §4, D6).
 *
 * Metin ağırlıklı bir üst bar: tek öğeli gruplar grup etiketiyle düz bağlantı
 * olur, çok öğeli gruplar `Menu` ile açılır. Öğe ikonları yoktur; aktif öğe
 * `usePathname` ile bulunur. Anonimde `personal` öğeler kilitli görünür ve
 * `/login?next=<href>` hedefine gider (bkz. `lib/auth/next-path.ts`).
 */
import { ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Menu, type MenuItem } from "@/components/ui/menu";
import { navGroups, primaryNavItem, type NavItem } from "@/config/navigation";
import { buildLoginRedirect } from "@/lib/auth/next-path";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: Route): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navItemClassName(active: boolean, locked = false): string {
  return cn(
    "inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm transition-colors duration-150 ease-out",
    active
      ? "bg-surface-hover font-medium text-foreground"
      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
    locked && "opacity-60",
  );
}

const isVisible = (item: NavItem) => !item.devOnly || process.env.NODE_ENV !== "production";

/** Üst bar navigasyonu; tek öğeli gruplar bağlantı, çok öğeliler menüdür. */
export function TopNav({ authenticated = true }: { authenticated?: boolean }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();

  const isLocked = (item: NavItem) => !authenticated && item.personal === true;

  const renderPlainLink = (item: NavItem, label: string) => {
    const locked = isLocked(item);
    const active = !locked && isActive(pathname, item.href);
    const href = locked ? (buildLoginRedirect(item.href) as Route) : item.href;
    return (
      <Link
        key={item.href}
        href={href}
        aria-current={active ? "page" : undefined}
        aria-disabled={locked || undefined}
        title={locked ? tCommon("loginRequired") : undefined}
        className={navItemClassName(active, locked)}
      >
        {label}
      </Link>
    );
  };

  const renderMenuItems = (items: readonly NavItem[]): MenuItem[] =>
    items.map((item) => {
      const locked = isLocked(item);
      return {
        label: t(item.labelKey),
        href: locked ? buildLoginRedirect(item.href) : (item.href as string),
        title: locked ? tCommon("loginRequired") : undefined,
        "aria-disabled": locked || undefined,
        active: !locked && isActive(pathname, item.href),
      };
    });

  return (
    <nav aria-label={tCommon("mainNavigation")} className="hidden items-center gap-1 md:flex">
      {renderPlainLink(primaryNavItem, t(primaryNavItem.labelKey))}
      {navGroups.map((group) => {
        const items = group.items.filter(isVisible);
        if (items.length === 0) {
          return null;
        }
        const groupLabel = t(`groups.${group.id}`);
        if (items.length === 1) {
          return renderPlainLink(items[0], groupLabel);
        }
        const active = items.some((item) => !isLocked(item) && isActive(pathname, item.href));
        return (
          <Menu
            key={group.id}
            align="start"
            trigger={
              <button type="button" className={navItemClassName(active)}>
                {groupLabel}
                <ChevronDown aria-hidden="true" className="size-3.5" />
              </button>
            }
            items={renderMenuItems(items)}
          />
        );
      })}
    </nav>
  );
}
