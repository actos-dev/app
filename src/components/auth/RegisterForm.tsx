"use client";

/**
 * Kayıt formu (plan U-01, A-01, A-06).
 *
 * Kayıt sonrası OTOMATİK GİRİŞ DENENMEZ: backend yeni hesapları
 * `email_verified = false` ile oluşturur ve login 403 döner. Bunun yerine
 * kullanıcı `/verify-email?email=...` ekranına yönlendirilir.
 *
 * Şifre kuralı backend'den (`UserRegister.password`, min 10) alınır.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

/** Backend `UserRegister.password` minimum uzunluğu. */
const PASSWORD_MIN_LENGTH = 10;

export function RegisterForm() {
  const t = useTranslations();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z
    .object({
      username: z.string().trim().min(1, t("auth.validation.usernameRequired")),
      email: z.string().min(1, t("auth.validation.emailRequired")).email(t("auth.validation.emailInvalid")),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, t("auth.validation.passwordTooShort", { count: PASSWORD_MIN_LENGTH })),
      confirmPassword: z.string().min(1, t("auth.validation.passwordRequired")),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      message: t("auth.validation.passwordMismatch"),
    });
  type RegisterValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: {
          username: values.username,
          email: values.email,
          password: values.password,
        },
      });
      const verifyPath = `/verify-email?email=${encodeURIComponent(values.email)}`;
      router.push(verifyPath as Route);
    } catch (error) {
      setFormError(translateBackendError(error instanceof ApiError ? error.code : undefined));
    }
  });

  return (
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

      <FormField label={t("auth.username")} error={errors.username?.message}>
        {(control) => (
          <Input
            {...control}
            type="text"
            autoComplete="username"
            placeholder={t("auth.usernamePlaceholder")}
            {...register("username")}
          />
        )}
      </FormField>

      <FormField label={t("auth.email")} error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            {...register("email")}
          />
        )}
      </FormField>

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

      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("auth.registerButton")}
      </Button>
    </form>
  );
}
