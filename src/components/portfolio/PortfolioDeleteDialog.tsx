"use client";

/**
 * Portföy silme onayı (Faz 4 / Birim 4.1, U-05).
 *
 * Geri alınamaz işlem önce diyalogla onaylanır; onayda `DELETE /portfolios/{id}`
 * çağrılır, başarıda liste tazelenir. Hata `error_*` kodu üzerinden i18n'e çevrilir.
 */
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDeletePortfolio } from "@/hooks/usePortfolios";

type PortfolioDeleteDialogProps = {
  id: string;
  name: string;
  /** Tetikleyici; verilmezse kart içi çöp kutusu butonu kullanılır. */
  trigger?: ReactElement;
  /** Silme başarılı olduktan sonra çağrılır (ör. detaydan listeye dönüş). */
  onDeleted?: () => void;
};

export function PortfolioDeleteDialog({
  id,
  name,
  trigger,
  onDeleted,
}: PortfolioDeleteDialogProps) {
  const t = useTranslations("portfolio");
  const [open, setOpen] = useState(false);
  const remove = useDeletePortfolio();

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger ?? (
          <Button variant="ghost" size="icon" aria-label={t("actions.delete", { name })}>
            <Trash2 aria-hidden="true" className="size-4" />
          </Button>
        )
      }
      title={t("delete.title")}
      description={t("delete.description", { name })}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t("delete.cancel")}
          </Button>
          <Button
            variant="danger"
            loading={remove.isPending}
            onClick={() =>
              remove.mutate(id, {
                onSuccess: () => {
                  setOpen(false);
                  onDeleted?.();
                },
              })
            }
          >
            {t("delete.confirm")}
          </Button>
        </>
      }
    />
  );
}
