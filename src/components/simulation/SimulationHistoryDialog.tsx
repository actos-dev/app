"use client";

/**
 * Simülasyon detay diyaloğu (Faz 5 / Birim 5A.2).
 *
 * Bir geçmiş satırının "Detay" butonuna basıldığında `GET
 * /simulations/history/{id}` çekilir ve sonuç özeti gösterilir. Diyalog
 * kapalıyken sorgu kapalıdır (`enabled: id !== null`); aynı kayıt tekrar
 * açıldığında önbellekten gelir.
 */
import { useTranslations } from "next-intl";

import { SimulationResultView, toResultLike } from "@/components/simulation/SimulationResultView";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulationDetail } from "@/hooks/useSimulations";
import { ErrorState } from "@/components/shared/ErrorState";

type SimulationHistoryDialogProps = {
  /** Açılacak kaydın kimliği; `null` iken istek atılmaz. */
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SimulationHistoryDialog({ id, open, onOpenChange }: SimulationHistoryDialogProps) {
  const t = useTranslations("simulation.history");
  const query = useSimulationDetail(open ? id : null);
  const detail = query.data;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={detail ? t("detailTitle", { ticker: detail.ticker }) : t("title")}
      description={
        detail
          ? t("detailDescription", { days: detail.days, bounds: detail.bounds })
          : t("detailLoading")
      }
    >
      {query.isLoading ? (
        <div className="flex flex-col gap-2" role="status">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full" />
          <span className="sr-only">{t("detailLoading")}</span>
        </div>
      ) : null}

      {query.isError ? (
        <ErrorState
          title={t("detailErrorTitle")}
          description={t("detailErrorDescription")}
          retry={{ label: t("retry"), onRetry: () => void query.refetch() }}
        />
      ) : null}

      {detail && !query.isLoading && !query.isError ? (
        <SimulationResultView result={toResultLike(detail)} showCredits={false} />
      ) : null}
    </Dialog>
  );
}
