"use client";

/**
 * Hızlı işlemler widget'ı (Faz 5B / Birim 5B.1, U-07).
 *
 * Kısayol eylemleri yalnız gezinme bağlantısıdır; kredi/maliyet hesabı gizli
 * değildir (kredi AppShell'de gösterilir). İkon + başlık ile sade tutulur.
 */
import { BarChart3, FileText, TrendingUp, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/shared/Panel";

type QuickAction = {
  href: Route;
  labelKey: "reports" | "simulation" | "markets";
  icon: LucideIcon;
};

const QUICK_ACTIONS: readonly QuickAction[] = [
  { href: "/research/reports", labelKey: "reports", icon: FileText },
  { href: "/research/simulation", labelKey: "simulation", icon: BarChart3 },
  { href: "/markets", labelKey: "markets", icon: TrendingUp },
];

type QuickActionsWidgetProps = {
  className?: string;
};

export function QuickActionsWidget({ className }: QuickActionsWidgetProps) {
  const t = useTranslations("dashboard.quickActions");

  return (
    <Panel title={t("title")} className={className}>
      <ul className="flex flex-col divide-y divide-border">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="flex min-h-11 items-center gap-3 rounded-md px-1 text-sm font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-raised text-muted-foreground">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                {t(action.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
