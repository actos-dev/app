"use client";

/**
 * E-posta değiştirme formu (Faz 5 / Birim 5B.2, A-01, A-03).
 *
 * Backend yeni e-postayı doğrulama gerektirmeden uygular; yeni adres bundan
 * sonra giriş adresi olur (form hint'i bunu açıkça söyler). Mevcut şifre
 * zorunludur. Hata kodu `translateBackendError` ile çevrilir
 * (`Email already in use` → `apiErrors.emailInUse`).
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
import { useUpdateEmail } from "@/hooks/useProfile";
import { ApiError } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

import { StatusMessage } from "./parts";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("profile");
  const tError = useTranslations();
  const update = useUpdateEmail();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().trim().min(1, t("account.emailRequired")).email(t("account.emailRequired")),
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
    defaultValues: { email: "", currentPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSuccess(false);
    setError(null);
    try {
      await update.mutateAsync({
        new_email: values.email.trim(),
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
      {success ? <StatusMessage kind="success">{t("account.emailSuccess")}</StatusMessage> : null}

      <FormField
        label={t("account.newEmail")}
        hint={t("account.currentValue", { value: currentEmail })}
        error={errors.email?.message}
      >
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            {...register("email")}
          />
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

      <p className="text-sm text-muted-foreground">{t("account.emailHint")}</p>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {t("account.saveEmail")}
        </Button>
      </div>
    </form>
  );
}
