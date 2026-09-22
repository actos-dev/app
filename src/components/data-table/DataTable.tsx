"use client";

/**
 * Sanallaştırılmış veri tablosu (plan P-07, P-06, K-01, A-02).
 *
 * TanStack Table v9 modeli + TanStack Virtual ile 500+ satırda akıcı kalır:
 * yalnız görünür satırlar (overscan dahil) DOM'a basılır, satırlar
 * `translateY` ile konumlanır. Başlık kaydırma kabı içinde `sticky`'dir.
 *
 * Modlar:
 *   - `sortingMode`: `"none" | "client" | "server"`. Sunucu modunda `sorting`
 *     kontrollüdür ve `onSortingChange` ile geri bildirilir.
 *   - `paginationMode`: `"none" | "client" | "server"`. Sunucu modunda
 *     `pagination` kontrollü + `rowCount` zorunludur.
 *
 * Satır aktivasyonu: `rowHref` verilirse satır bağlantı gibi davranır
 * (`tabIndex`, Enter/Space, Ctrl/Cmd ile yeni sekme).
 */
import {
  functionalUpdate,
  useTable,
  type CellData,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  columnGridTrack,
  dataTableFeatures,
  isColumnHidden,
  type DataTableColumnMeta,
  type DataTableFeatureSet,
  type ViewportBelow,
} from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DataTableDensity = "compact" | "comfortable";
export type DataTableSortingMode = "none" | "client" | "server";
export type DataTablePaginationMode = "none" | "client" | "server";

export type DataTableProps<TData extends RowData> = {
  columns: ReadonlyArray<ColumnDef<DataTableFeatureSet, TData, CellData>>;
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  /** Satır yüksekliği ritmi; varsayılan `compact`. */
  density?: DataTableDensity;
  /** Kaydırma kabı yüksekliği (px). */
  maxHeight?: number;
  /** Sanallaştırma tampon satırı; varsayılan 8. */
  overscan?: number;

  isLoading?: boolean;
  loadingRowCount?: number;
  error?: boolean;
  onRetry?: () => void;
  emptyState?: ReactNode;
  errorState?: ReactNode;

  sortingMode?: DataTableSortingMode;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  initialSorting?: SortingState;

  paginationMode?: DataTablePaginationMode;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  initialPageSize?: number;
  /** Sunucu sayfalamasında toplam satır sayısı. */
  rowCount?: number;

  /** Mobilde (md altı) satırları kart olarak çiz. */
  mobileCard?: boolean;
  /** Satır bağlantısı; verilirse satır klavyeyle etkinleştirilebilir. */
  rowHref?: (row: TData) => Route;
  className?: string;
  /** Tablo kabının erişilebilir adı. */
  ariaLabel?: string;
};

const DENSITY_ROW_HEIGHT: Record<DataTableDensity, number> = {
  compact: 36,
  comfortable: 44,
};

const CARD_ROW_HEIGHT = 132;

/** `matchMedia` ile kırılım altı takibi; SSR'de hepsi `false`. */
function useViewportBelow(): ViewportBelow {
  const [below, setBelow] = useState<ViewportBelow>({ sm: false, md: false, lg: false });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const queries = {
      sm: window.matchMedia("(max-width: 639px)"),
      md: window.matchMedia("(max-width: 767px)"),
      lg: window.matchMedia("(max-width: 1023px)"),
    };
    const update = () =>
      setBelow({ sm: queries.sm.matches, md: queries.md.matches, lg: queries.lg.matches });
    update();
    const listeners = Object.values(queries);
    listeners.forEach((query) => query.addEventListener("change", update));
    return () => listeners.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return below;
}

function SortIndicator({ sorted }: { sorted: false | "asc" | "desc" }) {
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;
  return <Icon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />;
}

function alignmentClasses(align: DataTableColumnMeta["align"]): string {
  if (align === "right") return "justify-end text-right";
  if (align === "center") return "justify-center text-center";
  return "justify-start text-left";
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  density = "compact",
  maxHeight = 560,
  overscan = 8,
  isLoading = false,
  loadingRowCount = 8,
  error = false,
  onRetry,
  emptyState,
  errorState,
  sortingMode = "client",
  sorting,
  onSortingChange,
  initialSorting,
  paginationMode = "none",
  pagination,
  onPaginationChange,
  initialPageSize = 20,
  rowCount,
  mobileCard = false,
  rowHref,
  className,
  ariaLabel,
}: DataTableProps<TData>) {
  const t = useTranslations("market.table");
  const router = useRouter();
  const below = useViewportBelow();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [initialState] = useState(() => ({
    pagination: { pageIndex: 0, pageSize: initialPageSize },
    ...(initialSorting ? { sorting: initialSorting } : {}),
  }));

  const controlledState = useMemo(() => {
    const state: { sorting?: SortingState; pagination?: PaginationState } = {};
    if (sortingMode === "server" && sorting) state.sorting = sorting;
    if (paginationMode === "server" && pagination) state.pagination = pagination;
    return state;
  }, [sortingMode, sorting, paginationMode, pagination]);

  const hasControlledState =
    (sortingMode === "server" && sorting !== undefined) ||
    (paginationMode === "server" && pagination !== undefined);

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      if (sortingMode !== "server") return;
      onSortingChange?.(functionalUpdate(updater, sorting ?? []));
    },
    [sortingMode, sorting, onSortingChange],
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      if (paginationMode !== "server") return;
      onPaginationChange?.(
        functionalUpdate(updater, pagination ?? { pageIndex: 0, pageSize: initialPageSize }),
      );
    },
    [paginationMode, pagination, initialPageSize, onPaginationChange],
  );

  const serverPageSize = pagination?.pageSize ?? initialPageSize;

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    ...(getRowId ? { getRowId } : {}),
    enableSorting: sortingMode !== "none",
    manualSorting: sortingMode === "server",
    manualPagination: paginationMode !== "client",
    ...(paginationMode === "server" && rowCount !== undefined
      ? { pageCount: Math.max(1, Math.ceil(rowCount / serverPageSize)) }
      : {}),
    ...(hasControlledState
      ? {
          state: controlledState,
          onSortingChange: handleSortingChange,
          onPaginationChange: handlePaginationChange,
        }
      : {}),
    initialState,
  });

  const rows = table.getRowModel().rows;
  const paginationState = table.state.pagination;
  const pageIndex = paginationState?.pageIndex ?? 0;
  const pageSize = paginationState?.pageSize ?? initialPageSize;

  const headerGroup = table.getHeaderGroups()[0];
  const visibleHeaders = (headerGroup?.headers ?? []).filter(
    (header) => !isColumnHidden(header.column.columnDef.meta, below),
  );
  const gridTemplateColumns = visibleHeaders
    .map((header) => columnGridTrack(header.column.columnDef.meta))
    .join(" ");
  const visibleColumnIds = new Set(visibleHeaders.map((header) => header.column.id));
  const headerById = new Map(visibleHeaders.map((header) => [header.column.id, header]));

  const isCardMode = mobileCard && below.md;
  const rowHeightClass = density === "compact" ? "h-9 md:h-9" : "h-11 md:h-11";
  const estimateSize = isCardMode ? CARD_ROW_HEIGHT : DENSITY_ROW_HEIGHT[density];

  // TanStack Virtual dönüş değeri fonksiyon taşır; React Compiler bu bileşeni
  // memoize etmez. Bu bilinçli ve güvenli: sanal satırlar zaten kendi ölçümüyle
  // güncellenir, memoize edilmemesi stale UI üretmez.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    getItemKey: (index) => rows[index]?.id ?? index,
    overscan,
  });
  const rowIndexBase = paginationMode === "none" ? 0 : pageIndex * pageSize;
  const totalRowCount =
    paginationMode === "server" && rowCount !== undefined ? rowCount : data.length;

  const activateRow = useCallback(
    (rowData: TData, event?: { metaKey?: boolean; ctrlKey?: boolean }) => {
      if (!rowHref) return;
      const href = rowHref(rowData);
      if (event && (event.metaKey || event.ctrlKey)) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }
      router.push(href);
    },
    [rowHref, router],
  );

  const showEmpty = !isLoading && !error && rows.length === 0;
  const canPaginate = paginationMode !== "none";
  const pageCount = canPaginate ? Math.max(1, table.getPageCount()) : 1;

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-surface", className)}>
      {/*
        `role="table"` yalnız satır gruplarını kapsar. Boş/hata durumu ve
        sayfalama düğmeleri bu kabın DIŞINDA tutulur; aksi halde axe
        `aria-required-children` (critical) tablo içinde düğüm düğmesi görür.
      */}
      <div
        ref={scrollRef}
        role="table"
        aria-label={ariaLabel}
        aria-rowcount={totalRowCount}
        aria-colcount={visibleHeaders.length}
        aria-busy={isLoading || undefined}
        className="relative overflow-auto"
        style={{ maxHeight }}
      >
        {!isCardMode ? (
          <div role="rowgroup" className="sticky top-0 z-10 border-b border-border bg-surface">
            <div role="row" aria-rowindex={1} className="grid w-full" style={{ gridTemplateColumns }}>
              {visibleHeaders.map((header, index) => {
                const meta = header.column.columnDef.meta;
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                const ariaSort =
                  !canSort ? undefined : sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none";
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-colindex={index + 1}
                    aria-sort={ariaSort}
                    className={cn(
                      "flex items-center px-3 py-2 text-xs font-medium text-muted-foreground",
                      alignmentClasses(meta?.align),
                    )}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex w-full items-center gap-1 rounded-sm text-xs font-medium hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
                          alignmentClasses(meta?.align),
                        )}
                      >
                        <span className="truncate">
                          <table.FlexRender header={header} />
                        </span>
                        <SortIndicator sorted={sorted} />
                      </button>
                    ) : (
                      <span className="w-full truncate">
                        <table.FlexRender header={header} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div role="rowgroup">
            {Array.from({ length: loadingRowCount }).map((_, rowIndex) => (
              <div
                key={`skeleton-${rowIndex}`}
                role="row"
                aria-rowindex={rowIndex + 2}
                className={cn("grid w-full items-center border-b border-border", rowHeightClass)}
                style={{ gridTemplateColumns }}
              >
                {visibleHeaders.map((header) => (
                  <div key={header.id} role="cell" className="px-3">
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : error || showEmpty ? null : (
          <div role="rowgroup" style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = rows[virtualItem.index];
              if (!row) return null;
              const cells = row
                .getAllCells()
                .filter((cell) => visibleColumnIds.has(cell.column.id));
              const href = rowHref?.(row.original);

              return (
                <div
                  key={row.id}
                  role="row"
                  aria-rowindex={rowIndexBase + virtualItem.index + 2}
                  data-index={virtualItem.index}
                  ref={isCardMode ? virtualizer.measureElement : undefined}
                  tabIndex={href ? 0 : undefined}
                  onClick={href ? (event) => activateRow(row.original, event) : undefined}
                  onKeyDown={
                    href
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            activateRow(row.original);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "absolute left-0 w-full border-b border-border",
                    isCardMode ? "h-auto px-3 py-3" : cn("grid items-center", rowHeightClass),
                    href &&
                      "cursor-pointer hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
                  )}
                  style={
                    isCardMode
                      ? { transform: `translateY(${virtualItem.start}px)` }
                      : { transform: `translateY(${virtualItem.start}px)`, gridTemplateColumns }
                  }
                >
                  {isCardMode ? (
                    <div className="flex flex-col gap-2">
                      {cells.map((cell) => {
                        const header = headerById.get(cell.column.id);
                        const headerLabel =
                          typeof header?.column.columnDef.header === "string"
                            ? header.column.columnDef.header
                            : cell.column.id;
                        return (
                          <div
                            key={cell.id}
                            role="cell"
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-xs text-muted-foreground">{headerLabel}</span>
                            <span className="text-sm text-foreground">
                              <table.FlexRender cell={cell} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    cells.map((cell, cellIndex) => (
                      <div
                        key={cell.id}
                        role="cell"
                        aria-colindex={cellIndex + 1}
                        className={cn(
                          "min-w-0 truncate px-3 text-sm",
                          alignmentClasses(cell.column.columnDef.meta?.align),
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showEmpty ? (
        <div className="p-4">{emptyState ?? <EmptyState title={t("empty")} />}</div>
      ) : null}

      {!isLoading && error ? (
        <div className="p-4">
          {errorState ?? (
            <ErrorState
              title={t("error")}
              {...(onRetry ? { retry: { label: t("retry"), onRetry } } : {})}
            />
          )}
        </div>
      ) : null}

      {canPaginate ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>{t("pagination.pageOf", { page: pageIndex + 1, total: pageCount })}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              {t("pagination.previous")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              {t("pagination.next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
