"use client";

/**
 * Halka arz tablosu (Faz 3 / Birim 3.2).
 *
 * Aktif + yaklaşan + taslak liste tek tabloda durum sütunuyla birleşir; liste
 * verileri RSC'den gelir (ek istek yok). Satır detayı bu birimde bilinçli
 * olarak yoktur (opsiyoneldi); kararı rapora işlendi. Dış bağlantılar
 * `safeExternalUrl` kapısından geçer.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useFormatters } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";
import type { IpoRow, IpoStatus } from "@/types/market";

type IpoTableProps = {
  rows: IpoRow[];
  failed: boolean;
};

const STATUS_VARIANT: Record<IpoStatus, BadgeProps["variant"]> = {
  active: "positive",
  upcoming: "info",
  draft: "neutral",
};

const STATUS_LABEL_KEY: Record<IpoStatus, string> = {
  active: "statusActive",
  upcoming: "statusUpcoming",
  draft: "statusDraft",
};

export function IpoTable({ rows, failed }: IpoTableProps) {
  const t = useTranslations("markets");
  const tIpos = useTranslations("markets.ipos");
  const { formatDateTime } = useFormatters();

  const columns = useMemo<ColumnDef<DataTableFeatureSet, IpoRow, CellData>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("columns.title"),
        enableSorting: false,
        meta: { width: "minmax(0, 2.4fr)" },
        cell: ({ row }) => {
          const href = safeExternalUrl(row.original.link);
          if (!href) {
            return <span className="truncate">{row.original.title}</span>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 truncate text-primary hover:underline"
            >
              <span className="truncate">{row.original.title}</span>
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            </a>
          );
        },
      },
      {
        accessorKey: "date",
        header: t("columns.date"),
        meta: { align: "right", width: "minmax(0, 1fr)", hideBelow: "sm" },
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatDateTime(row.original.date)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        enableSorting: false,
        meta: { align: "center", width: "minmax(0, 0.8fr)" },
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {tIpos(STATUS_LABEL_KEY[row.original.status])}
          </Badge>
        ),
      },
    ],
    [t, tIpos, formatDateTime],
  );

  return (
    <DataTable<IpoRow>
      columns={columns}
      data={rows}
      getRowId={(row) => `${row.status}-${row.id}`}
      sortingMode="client"
      initialSorting={[{ id: "date", desc: true }]}
      mobileCard
      ariaLabel={t("tabs.ipos")}
      error={failed}
      emptyState={<EmptyState title={t("empty")} />}
      errorState={<ErrorState title={t("error")} description={t("errorDescription")} />}
    />
  );
}
