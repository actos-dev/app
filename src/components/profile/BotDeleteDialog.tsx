"use client";

/**
 * Bot silme onayı (Faz 5 / Birim 5B.3).
 *
 * Silme geri alınamaz; botun kullanıcı adı açıkça gösterilir. Onay
 * `DELETE /bots/{id}` çağırır; başarı/hata bildirimi kancada yapılır.
 */
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useDeleteBot } from "@/hooks/useBots";
import type { Bot } from "@/lib/bots/types";

type BotDeleteDialogProps = {
  bot: Bot | null;
  onOpenChange: (open: boolean) => void;
};

export function BotDeleteDialog({ bot, onOpenChange }: BotDeleteDialogProps) {
  const t = useTranslations("bots");
  const remove = useDeleteBot();
  const open = bot !== null;

  const confirm = async () => {
    if (!bot) {
      return;
    }
    try {
      await remove.mutateAsync(bot.id);
      onOpenChange(false);
    } catch {
      // Hata toast'ı kancada gösterilir; diyalog açık kalır.
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("deleteTitle")}
      description={t("deleteDescription", { username: bot?.username ?? "" })}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={remove.isPending}
            onClick={() => {
              void confirm();
            }}
          >
            {t("deleteConfirm")}
          </Button>
        </>
      }
    />
  );
}
