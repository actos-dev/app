"use client";

/**
 * Kullanıcı adı değiştirme formu (Faz 5 / Birim 5B.2, A-01, A-03).
 *
 * Backend mevcut şifreyi zorunlu tutar; doğrulama zod ile istemcide de
 * yapılır. Hatalar `translateBackendError` ile i18n anahtarına çevrilir
 * (`error_username_taken` → `apiErrors.usernameTaken`), başarı `role="status"`
 * ile duyurulur (A-03).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useUpdateUsername } from "@/hooks/useProfile";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

import { StatusMessage } from "./parts";

export function UsernameForm({ currentUsername }: { currentUsername: string }) {
  const t = useTranslations("profile");
  const tError = useTranslations();
  const update = useUpdateUsername();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    username: z.string().trim().min(1, t("account.usernameRequired")),
    currentPassword: z.string().min(1, t("account.passwordRequired")),
  });
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", currentPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(false);
    setError(null);
    try {
      await update.mutateAsync({
        new_username: values.username.trim(),
        current_password: values.currentPassword,
      });
      reset();
      setSuccess(true);
    } catch (caught) {
      setError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? <StatusMessage kind="error">{tError(error)}</StatusMessage> : null}
      {success ? <StatusMessage kind="success">{t("account.usernameSuccess")}</StatusMessage> : null}

      <FormField
        label={t("account.newUsername")}
        hint={t("account.currentValue", { value: currentUsername })}
        error={errors.username?.message}
      >
        {(control) => (
          <Input {...control} type="text" autoComplete="username" {...register("username")} />
        )}
      </FormField>

      <FormField label={t("account.currentPassword")} error={errors.currentPassword?.message}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            {...register("currentPassword")}
          />
        )}
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {t("account.saveUsername")}
        </Button>
      </div>
    </form>
  );
}
