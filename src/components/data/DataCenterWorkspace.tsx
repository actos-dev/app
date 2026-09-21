"use client";

/**
 * Veri merkezi çalışma alanı (Faz 5 / Birim 5B.3).
 *
 * Akış: yıl + biçim seç → `POST /data/export` (202) → dönen id ile
 * `GET /data/export/{id}` poll edilir (5 sn; yalnız `queued`/`processing`).
 * Hazır olunca liste tazelenir ve indirme butonu belirir. Tüm talep geçmişi
 * `GET /data/export` listesinde gösterilir.
 *
 * Dürüst ilerleme: sahte yüzde YOK; süren iş için belirsiz (indeterminate)
 * animasyon ve açık metin kullanılır. 429/limit ve diğer backend hataları
 * hem toast (kanca) hem form altı `role="alert"` olarak gösterilir.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Database, Download, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useCreateExport, useDownloadExport, useExport, useExports } from "@/hooks/useExports";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import {
  EXPORT_FORMATS,
  isActiveExportStatus,
  type ExportFormat,
  type ExportJob,
  type ExportStatus,
} from "@/lib/data-center/types";
import { useFormatters } from "@/lib/format";
import { qk } from "@/lib/query/keys";

type DataCenterWorkspaceProps = {
  /** RSC'den gelen ilk talep listesi. */
  initialExports?: ExportJob[];
};

const FIRST_YEAR = 1990;

function statusBadgeVariant(status: ExportStatus): "positive" | "negative" | "info" {
  if (status === "ready" || status === "sent") {
    return "positive";
  }
  if (status === "failed") {
    return "negative";
  }
  return "info";
}

export function DataCenterWorkspace({ initialExports }: DataCenterWorkspaceProps) {
  const t = useTranslations("dataCenter");
  const { formatDateTime, formatPrice } = useFormatters();
  const queryClient = useQueryClient();

  const exportsQuery = useExports(initialExports);
  const create = useCreateExport();
  const download = useDownloadExport();

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () =>
      Array.from({ length: currentYear + 1 - FIRST_YEAR + 1 }, (_, index) => {
        const year = currentYear + 1 - index;
        return { value: String(year), label: String(year) };
      }),
    [currentYear],
  );

  const [year, setYear] = useState<string>(String(currentYear - 1));
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [formError, setFormError] = useState<string | null>(null);
  const [activeExportId, setActiveExportId] = useState<number | null>(null);

  const jobs = exportsQuery.data ?? [];
  const activeFromList = jobs.find((job) => isActiveExportStatus(job.status));
  const trackedId = activeExportId ?? activeFromList?.id ?? null;
  const tracked = useExport(trackedId);
  const trackedJob = tracked.data ?? null;

  // İş terminal duruma geçince liste bir kez tazelenir.
  useEffect(() => {
    if (trackedJob && !isActiveExportStatus(trackedJob.status)) {
      void queryClient.invalidateQueries({ queryKey: qk.exports.all() });
    }
  }, [trackedJob, queryClient]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    try {
      const result = await create.mutateAsync({ year: Number(year), format });
      setActiveExportId(result.export_id);
    } catch (caught) {
      setFormError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    }
  };

  const columns = useMemo<ColumnDef<DataTableFeatureSet, ExportJob, CellData>[]>(
    () => [
      {
        accessorKey: "year",
        header: t("columns.year"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.6fr)" },
        cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.year}</span>,
      },
      {
        accessorKey: "format",
        header: t("columns.format"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.6fr)", hideBelow: "sm" },
        cell: ({ row }) => <span className="uppercase">{row.original.format}</span>,
      },
      {
        accessorKey: "status",
        header: t("columns.status"),
        enableSorting: false,
        meta: { width: "minmax(0, 0.9fr)" },
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.original.status)}>
            {t(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "row_count",
        header: t("columns.rows"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "md" },
        cell: ({ row }) =>
          row.original.row_count === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums">
              {formatPrice(row.original.row_count, { fractionDigits: 0 })}
            </span>
          ),
      },
      {
        accessorKey: "size_bytes",
        header: t("columns.size"),
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)", hideBelow: "sm" },
        cell: ({ row }) =>
          row.original.size_bytes === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="tabular-nums">
              {t("sizeMb", {
                value: formatPrice(row.original.size_bytes / 1_048_576, { fractionDigits: 1 }),
              })}
            </span>
          ),
      },
      {
        accessorKey: "created_at",
        header: t("columns.created"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.3fr)", hideBelow: "md" },
        cell: ({ row }) => <span>{formatDateTime(row.original.created_at)}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.8fr)" },
        cell: ({ row }) =>
          row.original.downloadable ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => download.mutate(row.original)}
            >
              <Download aria-hidden="true" className="size-4" />
              {t("download")}
            </Button>
          ) : isActiveExportStatus(row.original.status) ? (
            <span className="text-xs text-muted-foreground">{t(`status.${row.original.status}`)}</span>
          ) : row.original.status === "failed" ? (
            <span className="text-xs text-negative">{t("status.failed")}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("expired")}</span>
          ),
      },
    ],
    [t, formatDateTime, formatPrice, download],
  );

  const emptyState = (
    <EmptyState
      icon={<Database aria-hidden="true" className="size-5" />}
      title={t("list.emptyTitle")}
      description={t("list.emptyDescription")}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("request.title")}>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative"
            >
              {t(formError)}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t("request.year")}
              options={yearOptions}
              value={year}
              onValueChange={(value) => setYear(value ?? String(currentYear - 1))}
            />

            <Select<ExportFormat>
              label={t("request.format")}
              options={EXPORT_FORMATS.map((value) => ({
                value,
                label: t(`request.formatValue.${value}`),
              }))}
              value={format}
              onValueChange={(value) => setFormat(value ?? "csv")}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("request.limitHint")}</p>
            <Button type="submit" loading={create.isPending}>
              {t("request.submit")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("request.emailHint")}</p>
        </form>
      </Panel>

      {trackedJob ? (
        <Panel title={t("tracking.title")}>
          <div className="flex flex-wrap items-center gap-3">
            {isActiveExportStatus(trackedJob.status) ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-info" />
            ) : null}
            <span className="text-sm text-foreground">
              {trackedJob.year} · {trackedJob.format.toUpperCase()}
            </span>
            <Badge variant={statusBadgeVariant(trackedJob.status)}>
              {t(`status.${trackedJob.status}`)}
            </Badge>
            {isActiveExportStatus(trackedJob.status) ? (
              <span className="text-sm text-muted-foreground" role="status">
                {t("processing")}
              </span>
            ) : null}
            {trackedJob.downloadable ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => download.mutate(trackedJob)}
              >
                <Download aria-hidden="true" className="size-4" />
                {t("download")}
              </Button>
            ) : null}
            {trackedJob.status === "failed" ? (
              <span className="text-sm text-negative" role="alert">
                {t("failedHint")}
              </span>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel title={t("list.title")}>
        <div className="flex flex-col gap-3">
          {!exportsQuery.isLoading && !exportsQuery.isError && jobs.length > 0 ? (
            <p className="text-sm text-muted-foreground" role="status">
              {t("list.count", { count: jobs.length })}
            </p>
          ) : null}

          <DataTable<ExportJob>
            columns={columns}
            data={jobs}
            getRowId={(row) => String(row.id)}
            isLoading={exportsQuery.isLoading}
            error={exportsQuery.isError}
            onRetry={() => void exportsQuery.refetch()}
            emptyState={emptyState}
            errorState={
              <ErrorState
                title={t("list.errorTitle")}
                description={t("list.errorDescription")}
                retry={{ label: t("list.retry"), onRetry: () => void exportsQuery.refetch() }}
              />
            }
            mobileCard
            ariaLabel={t("list.title")}
          />
        </div>
      </Panel>
    </div>
  );
}
