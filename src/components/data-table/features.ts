/**
 * DataTable özellik seti (plan P-07, K-01).
 *
 * TanStack Table v9 özellikleri AÇIKÇA kaydedilir: sıralama, sayfalama ve
 * `columnMeta`. Sıralama/sayfalama satır modelleri burada slot olarak durur;
 * sunucu taraflı modlarda `manualSorting`/`manualPagination` ile devre dışı
 * kalırlar.
 */
import {
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/** Sütun başına çizim meta bilgisi. */
export type DataTableColumnMeta = {
  /** Hücre/başlık hizası; sayısal sütunlar için `"right"`. */
  align?: "left" | "center" | "right";
  /** CSS grid track'i, ör. `"120px"` veya `"minmax(0, 2fr)"`. Varsayılan eşit. */
  width?: string;
  /** Bu genişliğin altında sütunu gizle (mobil). */
  hideBelow?: "sm" | "md" | "lg";
};

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: metaHelper<DataTableColumnMeta>(),
});

export type DataTableFeatureSet = typeof dataTableFeatures;

/** Görünüm genişliğinin kırılım altında olup olmadığı. */
export type ViewportBelow = {
  sm: boolean;
  md: boolean;
  lg: boolean;
};

/** `column.meta.hideBelow` kuralına göre sütun gizli mi? */
export function isColumnHidden(
  meta: DataTableColumnMeta | undefined,
  below: ViewportBelow,
): boolean {
  const breakpoint = meta?.hideBelow;
  return breakpoint ? below[breakpoint] : false;
}

/** Sütun için CSS grid track değeri. */
export function columnGridTrack(meta: DataTableColumnMeta | undefined): string {
  return meta?.width ?? "minmax(0, 1fr)";
}
