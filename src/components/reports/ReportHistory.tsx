"use client";

/**
 * Rapor geçmişi tablosu (Faz 5 / Birim 5A.1, U-06, S-11, K-09).
 *
 * İki kaynak: sorgu boşken `/reports/history` (istemci sayfalaması), sorgu
 * varken `/reports/search` (sunucu sayfalaması, `offset`). Arama 250 ms
 * debounce ile yapılır; her iki kaynak da `qk.reports.all()` kökü altında
 * olduğundan üretim sonrası tek invalidation ikisini de tazeler.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReportHistory, useReportSearch } from "@/hooks/useReports";
import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import { isReportType, reportHref } from "@/lib/reports/report";
import type { ReportHistoryItem } from "@/lib/reports/types";

/** Sayfa başına satır; arama uçunda `limit` olarak da kullanılır. */
export const REPORTS_PAGE_SIZE = 20;

/** Arama debounce süresi (ms). */
const SEARCH_DEBOUNCE_MS = 250;

type ReportHistoryProps = {
  /** RSC'den gelen ilk geçmiş sayfası; yoksa istemci çeker. */
  initialHistory?: ReportHistoryItem[];
};

export function ReportHistory({ initialHistory }: ReportHistoryProps) {
  const t = useTranslations("reports");
  const { formatDateTime, formatPrice } = useFormatters();

  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(term.trim());
      setPageIndex(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const searching = debouncedTerm.length > 0;
  const historyQuery = useReportHistory({}, searching ? undefined : initialHistory);
  const searchQuery = useReportSearch(debouncedTerm, {
    limit: REPORTS_PAGE_SIZE,
    offset: pageIndex * REPORTS_PAGE_SIZE,
  });

  const activeQuery = searching ? searchQuery : historyQuery;
  const items = activeQuery.data ?? [];
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const columns = useMemo<ColumnDef<DataTableFeatureSet, ReportHistoryItem, CellData>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("history.columns.title"),
        enableSorting: false,
        meta: { width: "minmax(0, 2fr)" },
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.title?.trim() || t("history.unknownTitle")}
          </span>
        ),
      },
      {
        accessorKey: "ticker",
        header: t("history.columns.ticker"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => <span className="font-mono">{row.original.ticker}</span>,
      },
      {
        accessorKey: "type",
        header: t("history.columns.type"),
        enableSorting: false,
        meta: { width: "minmax(0, 1fr)", hideBelow: "sm" },
        cell: ({ row }) =>
          isReportType(row.original.type) ? (
            <Badge variant={row.original.type === "deep_report" ? "info" : "neutral"}>
              {t(`type.${row.original.type}`)}
            </Badge>
          ) : (
            <span>{row.original.type}</span>
          ),
      },
      {
        accessorKey: "created_at",
        header: t("history.columns.date"),
        meta: { width: "minmax(0, 1.2fr)", hideBelow: "md" },
        cell: ({ row }) => <span>{formatDateTime(row.original.created_at)}</span>,
      },
      {
        accessorKey: "credits_spend",
        header: t("history.columns.cost"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => {
          const cost = row.original.credits_spend;
          return (
            <span className="tabular-nums">
              {cost === null || cost === undefined
                ? EMPTY_VALUE
                : t("history.costValue", { credits: formatPrice(cost, { fractionDigits: 0 }) })}
            </span>
          );
        },
      },
    ],
    [t, formatDateTime, formatPrice],
  );

  const serverRowCount = searching
    ? pageIndex * REPORTS_PAGE_SIZE + items.length + (items.length === REPORTS_PAGE_SIZE ? 1 : 0)
    : items.length;

  const emptyState = searching ? (
    <EmptyState
      icon={<Search aria-hidden="true" className="size-5" />}
      title={t("history.emptySearchTitle")}
      description={t("history.emptySearchDescription")}
    />
  ) : (
    <EmptyState
      icon={<Search aria-hidden="true" className="size-5" />}
      title={t("history.emptyTitle")}
      description={t("history.emptyDescription")}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex w-full max-w-sm flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{t("history.searchLabel")}</span>
          <span className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
            />
            <Input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("history.searchPlaceholder")}
              className="pl-9"
            />
          </span>
        </label>
        {!searching && !isLoading && !isError ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t("history.total", { count: items.length })}
          </p>
        ) : null}
      </div>

      <DataTable<ReportHistoryItem>
        columns={columns}
        data={items}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        error={isError}
        onRetry={() => void activeQuery.refetch()}
        emptyState={emptyState}
        errorState={
          <ErrorState
            title={t("history.errorTitle")}
            description={t("history.errorDescription")}
            retry={{ label: t("history.retry"), onRetry: () => void activeQuery.refetch() }}
          />
        }
        mobileCard
        rowHref={(row) => reportHref(row.id)}
        ariaLabel={t("history.title")}
        {...(searching
          ? {
              paginationMode: "server" as const,
              pagination: { pageIndex, pageSize: REPORTS_PAGE_SIZE },
              onPaginationChange: (next) => setPageIndex(next.pageIndex),
              rowCount: serverRowCount,
            }
          : {
              paginationMode: "client" as const,
              initialPageSize: REPORTS_PAGE_SIZE,
              initialSorting: [{ id: "created_at", desc: true }],
            })}
      />
    </div>
  );
}
