"use client";

/**
 * "Öne çıkanlar" analiz sekmesi (Faz 4 / Birim 4.3).
 *
 * Backend `performers` ucu en iyi/en kötü pozisyonları K/Z'ye göre sıralı
 * döner. Sembol satırları `/symbol/[ticker]` bağlantısıdır.
 */
import { Trophy, TrendingDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Delta } from "@/components/market/Delta";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortfolioPerformers } from "@/hooks/usePortfolios";
import { useFormatters } from "@/lib/format";
import type { PortfolioPerformer } from "@/lib/portfolio/types";

import { AnalyticsEmpty, AnalyticsError } from "./parts";

function PerformerList({
  title,
  items,
  icon,
}: {
  title: string;
  items: PortfolioPerformer[];
  icon: "best" | "worst";
}) {
  const { formatPrice } = useFormatters();
  const Icon = icon === "best" ? Trophy : TrendingDown;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon
          aria-hidden="true"
          className={icon === "best" ? "size-4 text-positive" : "size-4 text-negative"}
        />
        {title}
      </h3>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li
            key={item.ticker}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <Link
              href={`/symbol/${item.ticker}` as Route}
              className="font-mono text-sm text-foreground underline-offset-2 hover:underline"
            >
              {item.ticker}
            </Link>
            <span className="flex items-center gap-3 text-right">
              <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
                {formatPrice(item.amount, { fractionDigits: 0 })}
              </span>
              <Delta value={item.pnl} />
              <Delta value={item.pnl_percentage} percent className="min-w-16 justify-end" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type PerformersTabProps = { portfolioId: string };

export function PerformersTab({ portfolioId }: PerformersTabProps) {
  const t = useTranslations("portfolio.analytics");
  const query = usePortfolioPerformers(portfolioId);

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <AnalyticsError onRetry={() => void query.refetch()} />;
  }

  const { best, worst } = query.data;

  if (best.length === 0 && worst.length === 0) {
    return (
      <AnalyticsEmpty title={t("performers.empty")} description={t("performers.emptyHint")} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {best.length > 0 ? (
        <PerformerList title={t("performers.best")} items={best} icon="best" />
      ) : null}
      {worst.length > 0 ? (
        <PerformerList title={t("performers.worst")} items={worst} icon="worst" />
      ) : null}
    </div>
  );
}
