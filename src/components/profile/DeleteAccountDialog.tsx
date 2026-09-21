"use client";

/**
 * Hesap silme diyaloğu (Faz 5 / Birim 5B.2, S-07).
 *
 * İki adımlı onay: (1) geri alınamaz uyarı + "devam et", (2) kullanıcı adını
 * birebir yazma. Ad eşleşene kadar silme düğmesi pasiftir (kazara silme
 * engeli). Onayda `DELETE /auth/delete` çağrılır, ardından çıkış yapılıp `/`e
 * yönlendirilir; çıkış aynı zamanda çerezleri temizler.
 */
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useDeleteAccount } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useLogout";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

export function DeleteAccountDialog({ username }: { username: string }) {
  const t = useTranslations("profile");
  const tError = useTranslations();
  const { logout } = useLogout();
  const remove = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const matches = value.trim() === username;

  const reset = () => {
    setStep("warning");
    setValue("");
    setError(null);
  };

  const onConfirm = async () => {
    if (!matches) {
      return;
    }
    setError(null);
    try {
      await remove.mutateAsync();
      await logout({ redirectTo: "/" });
    } catch (caught) {
      setError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      trigger={<Button variant="danger">{t("security.deleteAction")}</Button>}
      title={t("security.deleteTitle")}
      description={t("security.deleteWarning")}
      footer={
        step === "warning" ? (
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              {t("security.cancel")}
            </Button>
            <Button variant="danger" type="button" onClick={() => setStep("confirm")}>
              {t("security.deleteContinue")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              {t("security.cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={!matches}
              loading={remove.isPending}
              onClick={() => {
                void onConfirm();
              }}
            >
              {t("security.deleteConfirmButton")}
            </Button>
          </>
        )
      }
    >
      {step === "confirm" ? (
        <FormField
          label={t("security.deleteConfirmLabel")}
          hint={t("security.deleteConfirmHint", { username })}
          error={error ? tError(error) : undefined}
        >
          {(control) => (
            <Input
              {...control}
              type="text"
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
        </FormField>
      ) : null}
    </Dialog>
  );
}
