"use client";

/**
 * `/markets` varlık sekmeleri (Faz 3 / Birim 3.2, M-06, A-02).
 *
 * Tabs bilinçli olarak Base UI değil, **link tabanlıdır**: her sekme bir
 * rotaya gider (farklı veri kaynağı), JS'siz de çalışır ve SSR'de doğru
 * `aria-current="page"` taşır. Aktiflik istemci state'ine bağlı değildir.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";

import { MARKET_ASSETS, buildAssetHref, type MarketAsset } from "@/lib/markets/params";
import { cn } from "@/lib/utils";

type MarketsTabsProps = {
  active: MarketAsset;
  className?: string;
};

export function MarketsTabs({ active, className }: MarketsTabsProps) {
  const t = useTranslations("markets.tabs");

  return (
    <nav aria-label={t("label")} className={cn("border-b border-border", className)}>
      <ul className="flex flex-wrap gap-1">
        {MARKET_ASSETS.map((asset) => {
          const isActive = asset === active;
          return (
            <li key={asset}>
              <Link
                href={buildAssetHref(asset)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-11 items-center rounded-t-md border-b-2 px-3 text-sm font-medium transition-colors duration-150 ease-out md:h-9",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(asset)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
