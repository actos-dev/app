"use client";

/**
 * Simülasyon geçmişi (Faz 5 / Birim 5A.2, U-03, U-06).
 *
 * Tablo `GET /simulations/history`ten beslenir; her satır "Detay" butonuyla
 * `GET /simulations/history/{id}` ucunu bir diyalogda açar. Satır tıklaması
 * yerine açık buton tercih edildi: diyalog tetikleyicisi klavyeyle erişilebilir
 * kalır ve `rowHref` gibi sahte bir bağlantı gerektirmez.
 *
 * Boş/hata/geçmiş durumları ayrı ayrı ele alınır (S-15).
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SimulationHistoryDialog } from "@/components/simulation/SimulationHistoryDialog";
import { Button } from "@/components/ui/button";
import { useSimulationHistory } from "@/hooks/useSimulations";
import { EMPTY_VALUE, useFormatters } from "@/lib/format";
import { confidencePercent, targetNumber } from "@/lib/simulations/simulation";
import type { SimulationHistoryItem } from "@/lib/simulations/types";

/** Sayfa başına satır. */
export const SIMULATIONS_PAGE_SIZE = 20;

type SimulationHistoryProps = {
  /** RSC'den gelen ilk geçmiş sayfası; yoksa istemci çeker. */
  initialHistory?: SimulationHistoryItem[];
};

export function SimulationHistory({ initialHistory }: SimulationHistoryProps) {
  const t = useTranslations("simulation.history");
  const { formatDateTime, formatPrice } = useFormatters();
  const query = useSimulationHistory(initialHistory);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const items = query.data ?? [];

  const columns = useMemo<ColumnDef<DataTableFeatureSet, SimulationHistoryItem, CellData>[]>(
    () => [
      {
        accessorKey: "ticker",
        header: t("columns.ticker"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => <span className="font-mono font-medium">{row.original.ticker}</span>,
      },
      {
        accessorKey: "days",
        header: t("columns.days"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.7fr)" },
        cell: ({ row }) => <span className="tabular-nums">{row.original.days}</span>,
      },
      {
        accessorKey: "bounds",
        header: t("columns.bounds"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.8fr)", hideBelow: "sm" },
        cell: ({ row }) => {
          const percent = confidencePercent(row.original.bounds);
          return (
            <span className="tabular-nums">
              {percent === null ? EMPTY_VALUE : t("boundsValue", { percent })}
            </span>
          );
        },
      },
      {
        accessorKey: "target",
        header: t("columns.target"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.9fr)", hideBelow: "md" },
        cell: ({ row }) => {
          const target = targetNumber(row.original.target);
          return (
            <span className="tabular-nums">
              {target === null ? t("targetAuto") : formatPrice(target)}
            </span>
          );
        },
      },
      {
        accessorKey: "cost",
        header: t("columns.cost"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "sm" },
        cell: ({ row }) =>
          row.original.cost === null ? (
            <span>{EMPTY_VALUE}</span>
          ) : (
            <span className="tabular-nums">
              {t("costValue", { credits: formatPrice(row.original.cost, { fractionDigits: 0 }) })}
            </span>
          ),
      },
      {
        accessorKey: "created_at",
        header: t("columns.date"),
        meta: { width: "minmax(0, 1.2fr)", hideBelow: "md" },
        cell: ({ row }) => <span>{formatDateTime(row.original.created_at)}</span>,
      },
      {
        id: "detail",
        header: "",
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.7fr)" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDetailId(row.original.id);
              setDialogOpen(true);
            }}
          >
            {t("rowAction")}
          </Button>
        ),
      },
    ],
    [t, formatDateTime, formatPrice],
  );

  const emptyState = (
    <EmptyState
      icon={<BarChart3 aria-hidden="true" className="size-5" />}
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {!query.isLoading && !query.isError && items.length > 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("total", { count: items.length })}
        </p>
      ) : null}

      <DataTable<SimulationHistoryItem>
        columns={columns}
        data={items}
        getRowId={(row) => String(row.id)}
        isLoading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        emptyState={emptyState}
        errorState={
          <ErrorState
            title={t("errorTitle")}
            description={t("errorDescription")}
            retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
          />
        }
        mobileCard
        ariaLabel={t("title")}
        initialSorting={[{ id: "created_at", desc: true }]}
        initialPageSize={SIMULATIONS_PAGE_SIZE}
      />

      <SimulationHistoryDialog
        id={detailId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
