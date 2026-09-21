"use client";

/**
 * BIST hisse tablosu (Faz 3 / Birim 3.2).
 *
 * Veri RSC'den `initialData` olarak gelir; istemci ek istek atmaz (P-02, çift
 * istek yok). Sıralama ve sayfa değişimi URL'e yazılır (`?sort=&page=`),
 * sunucu yeniden render eder. `DataTable` sunucu modunda kontrollüdür.
 */
import type { CellData, ColumnDef, SortingState } from "@tanstack/react-table";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Select, type SelectOption } from "@/components/ui/select";
import { useFormatters } from "@/lib/format";
import {
  buildMarketsHref,
  COMPANY_SORTS,
  MARKETS_PAGE_SIZE,
} from "@/lib/markets/params";
import type {
  CompanySummary,
  CompanySummaryResponse,
  CompanySummarySort,
} from "@/types/market";

type StocksTableProps = {
  initialData: CompanySummaryResponse | null;
  sort: CompanySummarySort;
  page: number;
};

/** Aktif `sort` değerinin tabloda gösterilecek sıralama durumu. */
const SORT_TO_SORTING: Record<CompanySummarySort, SortingState> = {
  popular: [],
  alphabetical: [{ id: "ticker", desc: false }],
  gainers: [{ id: "change_pct", desc: true }],
  losers: [{ id: "change_pct", desc: false }],
  price_high: [{ id: "last_price", desc: true }],
  price_low: [{ id: "last_price", desc: false }],
  volume: [{ id: "volume", desc: true }],
  market_cap: [{ id: "market_cap", desc: true }],
};

/** Başlık tıklamasının ürettiği kolon/yon → backend `sort` değeri. */
function sortFromSorting(sorting: SortingState): CompanySummarySort {
  const first = sorting[0];
  if (!first) {
    return "popular";
  }
  switch (first.id) {
    case "ticker":
      return "alphabetical";
    case "change_pct":
      return first.desc ? "gainers" : "losers";
    case "last_price":
      return first.desc ? "price_high" : "price_low";
    case "volume":
      return "volume";
    case "market_cap":
      return "market_cap";
    default:
      return "popular";
  }
}

export function StocksTable({ initialData, sort, page }: StocksTableProps) {
  const t = useTranslations("markets");
  const tSort = useTranslations("markets.sort");
  const router = useRouter();
  const { formatCompactNumber } = useFormatters();

  const rows = initialData?.data ?? [];
  const total = initialData?.total ?? 0;
  const failed = initialData === null;

  const navigate = useCallback(
    (nextSort: CompanySummarySort, nextPage: number) => {
      router.push(buildMarketsHref("stocks", { sort: nextSort, page: nextPage }));
    },
    [router],
  );

  const columns = useMemo<ColumnDef<DataTableFeatureSet, CompanySummary, CellData>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: t("columns.symbol"),
        meta: { width: "minmax(0, 0.8fr)" },
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
        accessorKey: "market_cap",
        header: t("columns.marketCap"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 1fr)", hideBelow: "lg" },
        cell: ({ row }) => formatCompactNumber(row.original.market_cap),
      },
    ],
    [t, formatCompactNumber],
  );

  const sortOptions = useMemo<SelectOption<CompanySummarySort>[]>(
    () => COMPANY_SORTS.map((value) => ({ value, label: tSort(value) })),
    [tSort],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select<CompanySummarySort>
          label={tSort("label")}
          value={sort}
          onValueChange={(value) => {
            if (value) {
              navigate(value, 1);
            }
          }}
          options={sortOptions}
          triggerClassName="w-48"
        />
        <p className="text-sm text-muted-foreground" role="status">
          {t("total", { count: total })}
        </p>
      </div>

      <DataTable<CompanySummary>
        columns={columns}
        data={rows}
        getRowId={(row) => row.ticker}
        sortingMode="server"
        sorting={SORT_TO_SORTING[sort]}
        onSortingChange={(next) => navigate(sortFromSorting(next), 1)}
        paginationMode="server"
        pagination={{ pageIndex: page - 1, pageSize: MARKETS_PAGE_SIZE }}
        onPaginationChange={(next) => navigate(sort, next.pageIndex + 1)}
        rowCount={total}
        mobileCard
        rowHref={(row) => `/symbol/${row.ticker}` as Route}
        ariaLabel={t("tabs.stocks")}
        error={failed}
        emptyState={<EmptyState title={t("empty")} />}
        errorState={
          <ErrorState
            title={t("error")}
            description={t("errorDescription")}
            retry={{ label: t("retry"), onRetry: () => router.refresh() }}
          />
        }
      />
    </div>
  );
}
