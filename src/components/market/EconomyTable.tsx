"use client";

/**
 * Döviz / kıymetli maden tablosu (Faz 3 / Birim 3.2, P-02, K-03).
 *
 * Tüm fiyatlar tek `/economy/quotes?group=` yanıtından gelir; satır başına
 * istek yoktur. Sıralama tamamen istemcide yapılır (sayfalama yok), bu yüzden
 * sekme değişimi dışında ek backend çağrısı üretmez.
 */
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { CellData, ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { useFormatters } from "@/lib/format";
import type { EconomyQuote, EconomyQuoteBundle } from "@/types/market";

type EconomyAsset = "fx" | "metals";

type EconomyTableProps = {
  asset: EconomyAsset;
  initialData: EconomyQuoteBundle | null;
};

export function EconomyTable({ asset, initialData }: EconomyTableProps) {
  const t = useTranslations("markets");
  const { formatDateTime } = useFormatters();

  const rows = useMemo<EconomyQuote[]>(
    () => Object.values(initialData?.quotes ?? {}),
    [initialData],
  );
  const failed = initialData === null;
  const source = initialData?.source ?? null;

  const columns = useMemo<ColumnDef<DataTableFeatureSet, EconomyQuote, CellData>[]>(
    () => [
      {
        accessorKey: "symbol",
        header: t("columns.symbol"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.2fr)" },
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span className="font-mono">{row.original.symbol}</span>
            {row.original.stale ? <Badge variant="warning">{t("stale")}</Badge> : null}
          </span>
        ),
      },
      {
        accessorKey: "buying",
        header: t("columns.buying"),
        sortUndefined: "last",
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => (
          <PriceText value={row.original.buying ?? row.original.price} />
        ),
      },
      {
        accessorKey: "selling",
        header: t("columns.selling"),
        sortUndefined: "last",
        meta: { align: "right", width: "minmax(0, 1fr)", hideBelow: "sm" },
        cell: ({ row }) => <PriceText value={row.original.selling} />,
      },
      {
        accessorKey: "change_pct",
        header: t("columns.change"),
        sortUndefined: "last",
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <Delta value={row.original.change_pct} percent />,
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("source", { source: source ?? "—" })} ·{" "}
        {t("updatedAt", { time: formatDateTime(initialData?.ts) })}
      </p>

      <DataTable<EconomyQuote>
        columns={columns}
        data={rows}
        getRowId={(row) => row.symbol}
        sortingMode="client"
        initialSorting={[{ id: "change_pct", desc: true }]}
        mobileCard
        ariaLabel={t(`tabs.${asset}`)}
        error={failed}
        emptyState={<EmptyState title={t("empty")} />}
        errorState={<ErrorState title={t("error")} description={t("errorDescription")} />}
      />
    </div>
  );
}
