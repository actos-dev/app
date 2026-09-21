"use client";

/**
 * İşlem geçmişi (Faz 4 / Birim 4.2, U-05, K-03).
 *
 * RSC'den gelen işlem listesini tabloda gösterir. "Son işlemi geri al" onay
 * diyaloğu hangi işlemin silineceğini açıkça yazar; satır başına kalem simgesi
 * fiyat düzeltme diyaloğunu açar. Tüm fiyatlar `tabular-nums` ile hizalıdır.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { Pencil, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { PriceText } from "@/components/market/PriceText";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFormatters } from "@/lib/format";
import { formatQuantity } from "@/lib/portfolio/trade";
import type { PortfolioTransaction } from "@/lib/portfolio/types";

import { TransactionEditDialog } from "./TransactionEditDialog";
import { UndoTransactionDialog } from "./UndoTransactionDialog";

type TransactionHistoryProps = {
  portfolioId: string;
  transactions: PortfolioTransaction[];
};

/** En son (geri alınacak) işlem: tarihe göre en yeni kayıt. */
function latestTransaction(transactions: PortfolioTransaction[]): PortfolioTransaction | null {
  return transactions.reduce<PortfolioTransaction | null>((latest, tx) => {
    if (!latest) {
      return tx;
    }
    return new Date(tx.date).getTime() >= new Date(latest.date).getTime() ? tx : latest;
  }, null);
}

export function TransactionHistory({ portfolioId, transactions }: TransactionHistoryProps) {
  const t = useTranslations("portfolio");
  const { formatDateTime } = useFormatters();
  const [editing, setEditing] = useState<PortfolioTransaction | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);

  const last = useMemo(() => latestTransaction(transactions), [transactions]);

  const rows = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

  const columns = useMemo<ColumnDef<DataTableFeatureSet, PortfolioTransaction, CellData>[]>(
    () => [
      {
        accessorKey: "date",
        header: t("detail.transactions.date"),
        meta: { width: "minmax(0, 1.1fr)", hideBelow: "sm" },
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums">
            {formatDateTime(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: t("detail.transactions.type"),
        meta: { width: "minmax(0, 0.7fr)" },
        cell: ({ row }) => (
          <Badge variant="neutral">
            {row.original.type === "BUY" ? t("trade.buy") : t("trade.sell")}
          </Badge>
        ),
      },
      {
        accessorKey: "ticker",
        header: t("detail.transactions.symbol"),
        meta: { width: "minmax(0, 0.9fr)" },
        cell: ({ row }) => <span className="font-mono">{row.original.ticker}</span>,
      },
      {
        accessorKey: "quantity",
        header: t("detail.transactions.quantity"),
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "sm" },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatQuantity(row.original.quantity)}</span>
        ),
      },
      {
        accessorKey: "price",
        header: t("detail.transactions.unitPrice"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <PriceText value={row.original.price} />,
      },
      {
        accessorKey: "commission",
        header: t("detail.transactions.commission"),
        meta: { align: "right", width: "minmax(0, 0.9fr)", hideBelow: "md" },
        cell: ({ row }) =>
          row.original.commission > 0 ? (
            <PriceText value={row.original.commission} />
          ) : (
            t("card.unavailable")
          ),
      },
      {
        accessorKey: "total",
        header: t("detail.transactions.total"),
        meta: { align: "right", width: "minmax(0, 1fr)" },
        cell: ({ row }) => <PriceText value={row.original.total} />,
      },
      {
        id: "actions",
        header: t("detail.transactions.actions"),
        enableSorting: false,
        meta: { align: "right", width: "72px" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("edit.action", { ticker: row.original.ticker })}
            onClick={() => setEditing(row.original)}
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>
        ),
      },
    ],
    [t, formatDateTime],
  );

  return (
    <Panel
      title={t("detail.transactions.title")}
      actions={
        last ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setUndoOpen(true)}
          >
            <Undo2 aria-hidden="true" className="size-4" />
            {t("undo.action")}
          </Button>
        ) : null
      }
    >
      <DataTable<PortfolioTransaction>
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        sortingMode="client"
        initialSorting={[{ id: "date", desc: true }]}
        mobileCard
        ariaLabel={t("detail.transactions.tableLabel")}
        emptyState={<p className="text-sm text-muted-foreground">{t("detail.transactions.empty")}</p>}
      />

      {editing ? (
        <TransactionEditDialog
          key={editing.id}
          portfolioId={portfolioId}
          transaction={editing}
          open
          onOpenChange={(next) => {
            if (!next) {
              setEditing(null);
            }
          }}
        />
      ) : null}

      {last ? (
        <UndoTransactionDialog
          key={`undo-${last.id}`}
          portfolioId={portfolioId}
          transaction={last}
          open={undoOpen}
          onOpenChange={setUndoOpen}
        />
      ) : null}
    </Panel>
  );
}
