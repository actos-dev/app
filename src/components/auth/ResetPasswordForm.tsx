"use client";

/**
 * Yeni şifre belirleme formu (plan Faz 2 / Birim 2.2b, A-01, A-03).
 *
 * `token` yoksa/boşsa ağ isteği atılmadan `invalidToken` durumu gösterilir.
 * Backend `POST /auth/reset-password` geçersiz/süresi dolmuş token'da
 * `error_invalid_or_expired_token` (400) döner (`auth.py:433-466`); bu da
 * `invalidToken` durumuna eşlenir. Diğer hatalar formda `role="alert"` kalır.
 *
 * Şifre kuralı backend'den (`ResetPassword.new_password`, min 10) alınır.
 * Başarıda `/login?reset=success`'e yönlendirilir; kısa mesaj giriş sayfasında
 * `role="status"` ile duyurulur.
 *
 * Durum makinesi: `form → submitting → success | invalidToken`.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthCard } from "@/components/auth/AuthCard";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { cn } from "@/lib/utils";

/** Backend `ResetPassword.new_password` minimum uzunluğu. */
const PASSWORD_MIN_LENGTH = 10;

type ResetStatus = "form" | "submitting" | "success" | "invalidToken";

type ResetPasswordFormProps = {
  /** Sorgu parametresinden gelen sıfırlama token'ı; yoksa `null`. */
  token: string | null;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [status, setStatus] = useState<ResetStatus>(token ? "form" : "invalidToken");
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z
    .object({
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t("auth.validation.passwordTooShort", { count: PASSWORD_MIN_LENGTH })),
      confirmPassword: z.string().min(1, t("auth.validation.passwordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: t("auth.validation.passwordMismatch"),
    });
  type ResetValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      setStatus("invalidToken");
      return;
    }
    setFormError(null);
    setStatus("submitting");
    try {
      await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: { token, new_password: values.password },
      });
      setStatus("success");
      router.replace("/login?reset=success");
    } catch (error) {
      if (error instanceof ApiError && error.code === "error_invalid_or_expired_token") {
        setStatus("invalidToken");
        return;
      }
      setFormError(translateBackendError(error instanceof ApiError ? error.code : undefined));
      setStatus("form");
    }
  });

  if (status === "invalidToken") {
    return (
      <AuthCard title={t("auth.resetInvalidTitle")}>
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative"
        >
          {t("auth.resetInvalidDescription")}
        </p>
        <Link
          href="/forgot-password"
          className={cn("w-full", buttonVariants({ variant: "primary" }))}
        >
          {t("auth.resetRequestNew")}
        </Link>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title={t("auth.resetSuccessTitle")}>
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {t("auth.resetSuccessDescription")}
        </p>
        <Link href="/login" className={cn("w-full", buttonVariants({ variant: "primary" }))}>
          {t("auth.loginLink")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.resetTitle")} description={t("auth.resetDescription")}>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {formError ? (
          <p
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative"
          >
            {t(formError)}
          </p>
        ) : null}

        <FormField
          label={t("auth.password")}
          hint={t("auth.passwordHint", { count: PASSWORD_MIN_LENGTH })}
          error={errors.password?.message}
        >
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              placeholder={t("auth.passwordPlaceholder")}
              {...register("password")}
            />
          )}
        </FormField>

        <FormField label={t("auth.confirmPassword")} error={errors.confirmPassword?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="new-password"
              placeholder={t("auth.confirmPasswordPlaceholder")}
              {...register("confirmPassword")}
            />
          )}
        </FormField>

        <Button type="submit" loading={status === "submitting"} className="w-full">
          {t("auth.resetButton")}
        </Button>
      </form>
    </AuthCard>
  );
}
