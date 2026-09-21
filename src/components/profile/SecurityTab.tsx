"use client";

/**
 * Güvenlik sekmesi (Faz 5 / Birim 5B.2, S-07, A-01, A-03).
 *
 * Şifre değiştirme (mevcut + yeni + tekrar; `autocomplete` doğru değerlerle)
 * ve hesap silme. Backend şifre değişiminde `password_changed_at` güncellediği
 * ve tüm refresh token'ları iptal ettiği için mevcut oturum da geçersizleşir;
 * başarıda kullanıcı açıkça "tekrar giriş yap" yönlendirmesiyle bilgilendirilir.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Panel } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useChangePassword } from "@/hooks/useProfile";
import { useLogout } from "@/hooks/useLogout";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { StatusMessage } from "./parts";

const MIN_PASSWORD_LENGTH = 10;

export function SecurityTab({ username }: { username: string }) {
  const t = useTranslations("profile");
  const tError = useTranslations();
  const change = useChangePassword();
  const { logout, isPending: isLoggingOut } = useLogout();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z
    .object({
      currentPassword: z.string().min(1, t("security.passwordRequired")),
      newPassword: z.string().min(MIN_PASSWORD_LENGTH, t("security.passwordTooShort")),
      confirmPassword: z.string().min(1, t("security.passwordRequired")),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: t("security.passwordMismatch"),
      path: ["confirmPassword"],
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(false);
    setError(null);
    try {
      await change.mutateAsync({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      reset();
      setSuccess(true);
    } catch (caught) {
      setError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("security.passwordTitle")}>
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {error ? <StatusMessage kind="error">{tError(error)}</StatusMessage> : null}
          {success ? (
            <div className="flex flex-col gap-3">
              <StatusMessage kind="success">{t("security.passwordSuccess")}</StatusMessage>
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isLoggingOut}
                  onClick={() => {
                    void logout({ redirectTo: "/login" });
                  }}
                >
                  {t("security.signInAgain")}
                </Button>
              </div>
            </div>
          ) : null}

          <FormField label={t("security.currentPassword")} error={errors.currentPassword?.message}>
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="current-password"
                {...register("currentPassword")}
              />
            )}
          </FormField>

          <FormField
            label={t("security.newPassword")}
            hint={t("security.passwordHint")}
            error={errors.newPassword?.message}
          >
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="new-password"
                {...register("newPassword")}
              />
            )}
          </FormField>

          <FormField label={t("security.confirmPassword")} error={errors.confirmPassword?.message}>
            {(control) => (
              <PasswordInput
                {...control}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            )}
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" loading={isSubmitting}>
              {t("security.submitPassword")}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel
        title={<span className="text-negative">{t("security.deleteTitle")}</span>}
        className="border-negative/40"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("security.deleteWarning")}</p>
          <div>
            <DeleteAccountDialog username={username} />
          </div>
        </div>
      </Panel>
    </div>
  );
}
