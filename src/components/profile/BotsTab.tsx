"use client";

/**
 * Profil > Botlar sekmesi (Faz 5 / Birim 5B.3, U-11).
 *
 * `GET /bots` listesi, yeni bot diyaloğu ve onaylı silme. Botlar sahibinin
 * kredisinden harcar ve e-posta doğrulamasından muaftır (backend gerçeği);
 * kullanıcı başına en fazla 5 bot açılabilir. Limit doluysa oluşturma
 * butonu baştan kapatılır; backend yine de 400 `error_bot_limit_reached`
 * dönebilir ve i18n toast'ı gösterilir.
 */
import type { CellData, ColumnDef } from "@tanstack/react-table";
import { Bot as BotIcon, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/data-table/DataTable";
import type { DataTableFeatureSet } from "@/components/data-table/features";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { useBots } from "@/hooks/useBots";
import { MAX_BOTS_PER_USER, type Bot } from "@/lib/bots/types";
import { useFormatters } from "@/lib/format";

import { BotCreateDialog } from "./BotCreateDialog";
import { BotDeleteDialog } from "./BotDeleteDialog";

export function BotsTab() {
  const t = useTranslations("bots");
  const { formatDateTime } = useFormatters();
  const query = useBots();
  const [createOpen, setCreateOpen] = useState(false);
  const [botToDelete, setBotToDelete] = useState<Bot | null>(null);

  const bots = query.data?.bots ?? [];
  const atLimit = bots.length >= MAX_BOTS_PER_USER;

  const columns = useMemo<ColumnDef<DataTableFeatureSet, Bot, CellData>[]>(
    () => [
      {
        accessorKey: "username",
        header: t("columns.username"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.4fr)" },
        cell: ({ row }) => (
          <span className="font-mono font-medium">{row.original.username}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: t("columns.createdAt"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.2fr)", hideBelow: "sm" },
        cell: ({ row }) => <span>{formatDateTime(row.original.created_at)}</span>,
      },
      {
        accessorKey: "last_login",
        header: t("columns.lastLogin"),
        enableSorting: false,
        meta: { width: "minmax(0, 1.2fr)", hideBelow: "md" },
        cell: ({ row }) =>
          row.original.last_login ? (
            <span>{formatDateTime(row.original.last_login)}</span>
          ) : (
            <span className="text-muted-foreground">{t("never")}</span>
          ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        meta: { align: "right", width: "minmax(0, 0.7fr)" },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setBotToDelete(row.original)}
          >
            {t("delete")}
          </Button>
        ),
      },
    ],
    [t, formatDateTime],
  );

  const emptyState = (
    <EmptyState
      icon={<BotIcon aria-hidden="true" className="size-5" />}
      title={t("emptyTitle")}
      description={t("emptyDescription")}
      action={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          {t("emptyCta")}
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title={t("title")}
        actions={
          <Button type="button" disabled={atLimit} onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            {t("create")}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("description")}</p>
          <p className="text-xs text-muted-foreground" role="status">
            {t("limit", { count: MAX_BOTS_PER_USER, current: bots.length })}
          </p>

          <DataTable<Bot>
            columns={columns}
            data={bots}
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
          />
        </div>
      </Panel>

      <BotCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <BotDeleteDialog bot={botToDelete} onOpenChange={(open) => !open && setBotToDelete(null)} />
    </div>
  );
}
