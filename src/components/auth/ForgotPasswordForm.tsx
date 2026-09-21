"use client";

/**
 * Şifre sıfırlama isteği formu (plan Faz 2 / Birim 2.2b, A-01, A-03).
 *
 * Backend `POST /auth/forgot-password` hesabın var olup olmamasından bağımsız
 * olarak her zaman 200 döner (hesap varlığı sızdırılmaz; `auth.py:382-430`).
 * Bu yüzden başarı durumu tek bir "bağlantı gönderildi" mesajıdır; kullanıcı
 * "farklı bir e-posta dene" ile e-postayı düzenleyip yeniden gönderebilir.
 *
 * Durum makinesi: `form → (submitting/RHF) → success`; backend hatası form
 * içinde `role="alert"` ile gösterilir ve kullanıcı formda kalır.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";

type ForgotStatus = "form" | "success";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [status, setStatus] = useState<ForgotStatus>("form");
  const [formError, setFormError] = useState<string | null>(null);

  const schema = z.object({
    email: z
      .string()
      .min(1, t("auth.validation.emailRequired"))
      .email(t("auth.validation.emailInvalid")),
  });
  type ForgotValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        body: { email: values.email },
      });
      setStatus("success");
    } catch (error) {
      setFormError(translateBackendError(error instanceof ApiError ? error.code : undefined));
    }
  });

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {t("auth.forgotSent")}
        </p>
        <Button type="button" variant="secondary" className="w-full" onClick={() => setStatus("form")}>
          {t("auth.forgotEditEmail")}
        </Button>
      </div>
    );
  }

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

      <Button type="submit" loading={isSubmitting} className="w-full">
        {t("auth.forgotButton")}
      </Button>
    </form>
  );
}
