"use client";

/**
 * Takip listesi tablosu (Faz 3 / Birim 3.4, P-02, U-12, U-13, S-11).
 *
 * RSC ilk verisi (`GET /favorites` + TEK toplu `/companies/summary?tickers=`)
 * `initialData` olarak gelir; satır başına fiyat isteği YOKTUR (P-02). Satırlar
 * güncel favori listesinden türetilir; böylece optimistic kaldırma satırı anında
 * düşürür ve ek `summary` isteği tetiklemez.
 *
 * Piyasa açıkken tablo `usePollingInterval` ile yenilenir. Favori kaldırma
 * mevcut `useFavorites` optimistic akışını kullanır; hata halinde geri alınır
 * ve toast gösterilir. 429'da agresif yeniden deneme yapılmaz, nazik bir
 * açıklama ve "tekrar dene" sunulur (S-11).
 */
import { useQuery } from "@tanstack/react-query";
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { Star, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { SymbolSearch } from "@/components/market/SymbolSearch";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { ApiError, apiFetch } from "@/lib/api/client";
import { useFormatters } from "@/lib/format";
import { WATCHLIST_TICKER_LIMIT } from "@/lib/markets/params";
import { useMarketStatus, usePollingInterval } from "@/lib/query/polling";
import { qk } from "@/lib/query/keys";
import type { CompanySummary, CompanySummaryResponse, MarketStatus } from "@/types/market";

type WatchlistTableProps = {
  /** SSR'dan gelen favori ticker listesi. */
  initialFavorites: string[];
  /** SSR'daki tek toplu fiyat yanıtı; istek başarısızsa `null`. */
  initialSummary: CompanySummaryResponse | null;
  /** `GET /favorites` SSR'da başarısız olduysa `true`. */
  initialFailed: boolean;
  /** Piyasa durumu (polling kararı için); SSR'dan gelir. */
  initialStatus?: MarketStatus;
};

export function WatchlistTable({
  initialFavorites,
  initialSummary,
  initialFailed,
  initialStatus,
}: WatchlistTableProps) {
  const t = useTranslations("watchlist");
  const router = useRouter();
  const { formatCompactNumber } = useFormatters();
  const { favorites, toggle } = useFavorites({ initialFavorites });

  // Piyasa durumu sorgusunu SSR verisiyle tohumla; `usePollingInterval` aynı
  // anahtarı okuduğu için ilk boyamada ek `/market/status` isteği atılmaz.
  useMarketStatus(initialStatus ? { initialData: initialStatus } : {});
  const refetchInterval = usePollingInterval();

  const summaryQuery = useQuery({
    queryKey: qk.companies({ tickers: initialFavorites, limit: WATCHLIST_TICKER_LIMIT }),
    queryFn: () =>
      apiFetch<CompanySummaryResponse>("/api/v1/companies/summary", {
        query: { tickers: initialFavorites.join(","), limit: WATCHLIST_TICKER_LIMIT },
      }),
    enabled: favorites.length > 0,
    initialData: initialSummary ?? undefined,
    refetchInterval,
  });

  const summaryMap = useMemo(() => {
    const map = new Map<string, CompanySummary>();
    for (const row of summaryQuery.data?.data ?? []) {
      map.set(row.ticker, row);
    }
    return map;
  }, [summaryQuery.data]);

  const rows = useMemo(
    () =>
      favorites.flatMap((ticker) => {
        const row = summaryMap.get(ticker);
        return row ? [row] : [];
      }),
    [favorites, summaryMap],
  );

  const remove = useCallback((ticker: string) => toggle(ticker), [toggle]);

  const columns = useMemo<ColumnDef<DataTableFeatureSet, CompanySummary, CellData>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: t("columns.symbol"),
        meta: { width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => <span className="font-mono">{row.original.ticker}</span>,
      },
      {
        accessorKey: "name",
        header: t("columns.name"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.8fr)", hideBelow: "sm" },
      },
      {
        accessorKey: "last_price",
        header: t("columns.price"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <PriceText value={row.original.last_price} />,
      },
      {
        accessorKey: "change_pct",
        header: t("columns.change"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <Delta value={row.original.change_pct} percent />,
      },
      {
        accessorKey: "volume",
        header: t("columns.volume"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 1fr)", hideBelow: "md" },
        cell: ({ row }) => formatCompactNumber(row.original.volume),
      },
      {
        id: "actions",
        header: t("columns.actions"),
        enableSorting: false,
        meta: { align: "right", width: "96px" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("remove", { ticker: row.original.ticker })}
            onClick={(event) => {
              // Satır bağlantısının tetiklenmemesi için tıklama yutulur.
              event.stopPropagation();
              remove(row.original.ticker);
            }}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        ),
      },
    ],
    [t, formatCompactNumber, remove],
  );

  if (initialFailed) {
    return (
      <ErrorState
        title={t("error")}
        description={t("errorDescription")}
        retry={{ label: t("retry"), onRetry: () => router.refresh() }}
      />
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<Star aria-hidden="true" className="size-5" />}
        title={t("empty.title")}
        description={t("empty.description")}
        action={
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link href="/markets" className={buttonVariants({ variant: "primary", size: "sm" })}>
              {t("empty.cta")}
            </Link>
            <SymbolSearch className="sm:w-64" />
          </div>
        }
      />
    );
  }

  const loaded = summaryQuery.data !== undefined;
  const unresolved = loaded
    ? favorites.filter((ticker) => !summaryMap.has(ticker))
    : [];
  const rateLimited =
    summaryQuery.error instanceof ApiError && summaryQuery.error.status === 429;
  const hasError = summaryQuery.isError && rows.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {unresolved.length > 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("unresolved", { symbols: unresolved.join(", ") })}
        </p>
      ) : null}

      {rateLimited && rows.length > 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("rateLimited")}
        </p>
      ) : null}

      <DataTable<CompanySummary>
        columns={columns}
        data={rows}
        getRowId={(row) => row.ticker}
        sortingMode="client"
        initialSorting={[{ id: "change_pct", desc: true }]}
        isLoading={summaryQuery.isPending && rows.length === 0}
        error={hasError}
        mobileCard
        rowHref={(row) => `/symbol/${row.ticker}` as Route}
        ariaLabel={t("tableLabel")}
        emptyState={<EmptyState title={t("emptyTable")} />}
        errorState={
          <ErrorState
            title={t("error")}
            description={rateLimited ? t("rateLimited") : t("errorDescription")}
            retry={{ label: t("retry"), onRetry: () => void summaryQuery.refetch() }}
          />
        }
      />
    </div>
  );
}
