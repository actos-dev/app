"use client";

/**
 * Takip listesi widget'ı (Faz 5B / Birim 5B.1, P-05, P-02, U-13).
 *
 * Favoriler RSC'den `initialFavorites` olarak gelir; fiyatlar İÇİN TEK toplu
 * `/companies/summary?tickers=` isteği kullanılır (satır başına istek yok).
 * Sorgu anahtarı `WatchlistTable` ile aynıdır (`qk.companies`), böylece iki
 * ekran önbelleği paylaşır. Favori yoksa özet isteği atılmaz.
 *
 * Piyasa açıkken `usePollingInterval` ile tazelenir; kapalıyken aralık `false`.
 * Satırlar `/symbol/{ticker}` sayfasına bağlanır.
 */
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { apiFetch } from "@/lib/api/client";
import { WATCHLIST_TICKER_LIMIT } from "@/lib/markets/params";
import { qk } from "@/lib/query/keys";
import { usePollingInterval } from "@/lib/query/polling";
import type { CompanySummary, CompanySummaryResponse } from "@/types/market";

/** Widget'ta gösterilen azami satır; kalanı `/watchlist`'te. */
const MAX_ROWS = 6;

type WatchlistWidgetProps = {
  initialFavorites: string[];
  initialSummary: CompanySummaryResponse | null;
  className?: string;
};

export function WatchlistWidget({
  initialFavorites,
  initialSummary,
  className,
}: WatchlistWidgetProps) {
  const t = useTranslations("dashboard.watchlist");
  const { favorites } = useFavorites({ initialFavorites });
  const refetchInterval = usePollingInterval();

  const summaryQuery = useQuery({
    queryKey: qk.companies({ tickers: initialFavorites, limit: WATCHLIST_TICKER_LIMIT }),
    queryFn: () =>
      apiFetch<CompanySummaryResponse>("/api/v1/companies/summary", {
        query: { tickers: initialFavorites.join(","), limit: WATCHLIST_TICKER_LIMIT },
      }),
    enabled: favorites.length > 0,
    refetchInterval,
    ...(initialSummary ? { initialData: initialSummary } : {}),
  });

  const summaryMap = useMemo(() => {
    const map = new Map<string, CompanySummary>();
    for (const row of summaryQuery.data?.data ?? []) {
      map.set(row.ticker, row);
    }
    return map;
  }, [summaryQuery.data]);

  const rows = useMemo(
    () => favorites.slice(0, MAX_ROWS).map((ticker) => ({ ticker, summary: summaryMap.get(ticker) })),
    [favorites, summaryMap],
  );

  return (
    <Panel
      title={t("title")}
      className={className}
      actions={
        favorites.length > 0 ? (
          <Link
            href={"/watchlist" as Route}
            className="text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
          >
            {t("viewAll")}
          </Link>
        ) : null
      }
    >
      {favorites.length === 0 ? (
        <EmptyState
          icon={<Star aria-hidden="true" className="size-5" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Link href={"/markets" as Route} className={buttonVariants({ size: "sm" })}>
                {t("emptyCta")}
              </Link>
              <SymbolSearch className="sm:w-56" />
            </div>
          }
        />
      ) : summaryQuery.isError && rows.every((row) => !row.summary) ? (
        <ErrorState
          title={t("error")}
          retry={{ label: t("retry"), onRetry: () => void summaryQuery.refetch() }}
        />
      ) : summaryQuery.isPending && !summaryQuery.data ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map(({ ticker, summary }) => (
            <li key={ticker}>
              <Link
                href={`/symbol/${ticker}` as Route}
                className="flex min-h-11 items-center justify-between gap-3 rounded-md px-1 text-sm text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover md:min-h-9"
              >
                <span className="min-w-0 truncate font-mono">{ticker}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <PriceText value={summary?.last_price ?? null} />
                  <Delta value={summary?.change_pct ?? null} percent />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
