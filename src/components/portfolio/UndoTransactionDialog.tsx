"use client";

/**
 * Son işlemi geri alma onayı (Faz 4 / Birim 4.2, U-05).
 *
 * Geri alınamaz olduğundan hangi işlemin silineceği (tarih, yön, sembol, adet)
 * onay metninde AÇIKÇA yazılır; onayda `DELETE .../transactions/undo` çağrılır.
 * Backend başka bir işlem yoksa `error_nothing_to_undo` döner ve i18n mesajı
 * gösterilir.
 */
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useUndoLastTransaction } from "@/hooks/usePortfolios";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { useFormatters } from "@/lib/format";
import { formatQuantity } from "@/lib/portfolio/trade";
import type { PortfolioTransaction } from "@/lib/portfolio/types";

type UndoTransactionDialogProps = {
  portfolioId: string;
  /** Silinecek (en son) işlem; yoksa diyalog açılmaz. */
  transaction: PortfolioTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UndoTransactionDialog({
  portfolioId,
  transaction,
  open,
  onOpenChange,
}: UndoTransactionDialogProps) {
  const t = useTranslations("portfolio");
  const tErrors = useTranslations();
  const { formatDateTime } = useFormatters();
  const undo = useUndoLastTransaction(portfolioId);

  const serverError = undo.isError
    ? tErrors(translateBackendError(undo.error instanceof ApiError ? undo.error.code : undefined))
    : null;

  const summary = t("undo.summary", {
    date: formatDateTime(transaction.date),
    type: transaction.type === "BUY" ? t("trade.buy") : t("trade.sell"),
    ticker: transaction.ticker,
    quantity: formatQuantity(transaction.quantity),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          undo.reset();
        }
        onOpenChange(next);
      }}
      title={t("undo.title")}
      description={t("undo.description")}
    >
      <p className="rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-foreground">
        {summary}
      </p>

      {serverError ? (
        <p role="alert" className="text-xs text-negative">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
          {t("undo.cancel")}
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={undo.isPending}
          onClick={() => undo.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
        >
          {t("undo.confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
