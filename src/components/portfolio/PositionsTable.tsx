"use client";

/**
 * Portföy pozisyon tablosu (Faz 4 / Birim 4.2, U-05, K-03, P-07).
 *
 * Veri RSC'den gelen değerleme yanıtıdır; pozisyon başına ek istek YOKTUR.
 * Sembol hücresi `/symbol/[ticker]` bağlantısıdır; satır aksiyonu al/sat
 * diyaloğunu ilgili sembolle açar. Fiyatı alınamayan pozisyonlarda değerler
 * "—" gösterilir ve satır çökmez.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { Briefcase } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { Delta } from "@/components/market/Delta";
import { PriceText } from "@/components/market/PriceText";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/lib/format";
import { formatQuantity } from "@/lib/portfolio/trade";
import type { PortfolioValuationAsset, TradeType } from "@/lib/portfolio/types";

type PositionsTableProps = {
  assets: PortfolioValuationAsset[];
  /** Toplam pozisyon değeri; ağırlık hesabı için. */
  holdingsValue: number;
  /** Satır/boş durum aksiyonu: al/sat diyaloğunu açar. */
  onTrade: (ticker?: string, type?: TradeType) => void;
};

export function PositionsTable({ assets, holdingsValue, onTrade }: PositionsTableProps) {
  const t = useTranslations("portfolio");
  const { formatPrice } = useFormatters();

  const columns = useMemo<ColumnDef<DataTableFeatureSet, PortfolioValuationAsset, CellData>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: t("detail.positions.symbol"),
        meta: { width: "minmax(0, 0.9fr)" },
        cell: ({ row }) => (
          <Link
            href={`/symbol/${row.original.ticker}` as Route}
            className="font-mono text-foreground underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {row.original.ticker}
          </Link>
        ),
      },
      {
        accessorKey: "amount",
        header: t("detail.positions.amount"),
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "sm" },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatQuantity(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: "weighted_avg_cost",
        header: t("detail.positions.avgCost"),
        meta: { align: "right", width: "minmax(0, 1fr)", hideBelow: "md" },
        cell: ({ row }) => <PriceText value={row.original.weighted_avg_cost} />,
      },
      {
        accessorKey: "current_price",
        header: t("detail.positions.currentPrice"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <PriceText value={row.original.current_price} />,
      },
      {
        accessorKey: "total_value",
        header: t("detail.positions.marketValue"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <PriceText value={row.original.total_value} />,
      },
      {
        accessorKey: "unrealized_pnl",
        header: t("detail.positions.pnl"),
        meta: { align: "right", width: "minmax(0, 1.1fr)" },
        cell: ({ row }) => (
          <span className="flex flex-col items-end">
            <Delta value={row.original.unrealized_pnl} />
            <Delta value={row.original.unrealized_pnl_pct} percent className="text-xs" />
          </span>
        ),
      },
      {
        id: "weight",
        header: t("detail.positions.weight"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "lg" },
        cell: ({ row }) => {
          const value = row.original.total_value;
          if (value === null || holdingsValue <= 0) {
            return t("card.unavailable");
          }
          return (
            <span className="font-mono tabular-nums">
              {formatPrice((value / holdingsValue) * 100, { fractionDigits: 1 })}%
            </span>
          );
        },
      },
      {
        id: "actions",
        header: t("detail.positions.actions"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onTrade(row.original.ticker);
            }}
          >
            {t("trade.buy")}
          </Button>
        ),
      },
    ],
    [t, formatPrice, holdingsValue, onTrade],
  );

  return (
    <DataTable<PortfolioValuationAsset>
      columns={columns}
      data={assets}
      getRowId={(row) => row.ticker}
      sortingMode="client"
      initialSorting={[{ id: "total_value", desc: true }]}
      mobileCard
      ariaLabel={t("detail.positions.tableLabel")}
      emptyState={
        <EmptyState
          icon={<Briefcase aria-hidden="true" className="size-5" />}
          title={t("detail.positions.emptyTitle")}
          description={t("detail.positions.emptyDescription")}
          action={
            <Button type="button" onClick={() => onTrade()}>
              {t("trade.buy")}
            </Button>
          }
        />
      }
    />
  );
}
