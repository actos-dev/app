"use client";

/**
 * Portföy kartı (Faz 4 / Birim 4.1, U-05, K-03).
 *
 * `PortfolioCardModel` özet ve fallback kaynaklarını tek görünüme indirger;
 * fallback'te değerleme alanları `null` gelir ve "—" gösterilir. Kartın tamamı
 * başlık bağlantısının yayılmış (`after:absolute`) alanıdır; çoğalt/sil
 * düğmeleri `z-10` ile bu alanın üstünde kalır.
 */
import { Copy } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Delta } from "@/components/market/Delta";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/lib/format";

import { PortfolioDeleteDialog } from "./PortfolioDeleteDialog";

export type PortfolioCardModel = {
  id: string;
  name: string;
  currency: string | null;
  currentValue: number | null;
  dailyChangePct: number | null;
  totalReturnPct: number | null;
  positionCount: number | null;
  asOf: string | null;
};

type PortfolioCardProps = {
  portfolio: PortfolioCardModel;
  onDuplicate: (portfolio: PortfolioCardModel) => void;
  duplicating?: boolean;
};

export function PortfolioCard({ portfolio, onDuplicate, duplicating }: PortfolioCardProps) {
  const t = useTranslations("portfolio");
  const { formatPrice, formatDateTime } = useFormatters();

  // typedRoutes dinamik segmenti statik ifade edemediğinden tek zorunlu cast;
  // hedef her zaman `/portfolio/{id}` desenindedir.
  const href = `/portfolio/${portfolio.id}` as Route;
  const asOf = portfolio.asOf ? formatDateTime(portfolio.asOf) : null;

  return (
    <li className="relative flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-150 ease-out hover:bg-surface-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={href}
            aria-label={t("actions.open", { name: portfolio.name })}
            className="truncate text-sm font-semibold text-foreground after:absolute after:inset-0 after:rounded-lg"
          >
            {portfolio.name}
          </Link>
          {portfolio.currency ? (
            <span className="text-xs text-muted-foreground">{portfolio.currency}</span>
          ) : null}
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("actions.duplicate", { name: portfolio.name })}
            disabled={duplicating}
            onClick={() => onDuplicate(portfolio)}
          >
            <Copy aria-hidden="true" className="size-4" />
          </Button>
          <PortfolioDeleteDialog id={portfolio.id} name={portfolio.name} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="truncate text-xs text-muted-foreground">{t("card.currentValue")}</dt>
          <dd className="truncate font-mono text-sm tabular-nums text-foreground">
            {portfolio.currentValue === null
              ? t("card.unavailable")
              : formatPrice(portfolio.currentValue)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="truncate text-xs text-muted-foreground">{t("card.dailyChange")}</dt>
          <dd>
            <Delta value={portfolio.dailyChangePct} percent />
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="truncate text-xs text-muted-foreground">{t("card.totalReturn")}</dt>
          <dd>
            <Delta value={portfolio.totalReturnPct} percent />
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {portfolio.positionCount === null
            ? t("card.unavailable")
            : t("card.positions", { count: portfolio.positionCount })}
        </span>
        <span className="truncate">
          {asOf ? t("card.asOf", { time: asOf }) : t("card.asOfUnavailable")}
        </span>
      </div>
    </li>
  );
}
