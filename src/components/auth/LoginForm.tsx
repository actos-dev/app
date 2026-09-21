"use client";

/**
 * Giriş formu (plan U-01, A-01, A-03, A-06).
 *
 * - Mount'ta sessiz oturum geri yükleme: refresh çerezi `path=/api/v1/auth`
 *   ile eşleştiği için istemciden BFF refresh çağrısı çalışır; başarılıysa
 *   kullanıcı `next` hedefine gider, değilse form gösterilir.
 * - Gönderim `application/x-www-form-urlencoded` (backend OAuth2 form akışı).
 * - Hatalar `translateBackendError` ile i18n anahtarına çevrilir.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api/client";
import { refreshSessionClient } from "@/lib/api/refresh-lock";
import { translateBackendError } from "@/lib/backend-errors";

type LoginFormProps = {
  /** Sunucuda `sanitizeNextPath` ile doğrulanmış hedef. */
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [restoring, setRestoring] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  // `useRouter()` nesnesi render başına yeni olabilir (test mock'u); effect
  // yalnız mount'ta bir kez çalışsın diye güncel router ref'te tutulur.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const schema = z.object({
    username: z.string().trim().min(1, t("auth.validation.usernameRequired")),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
  });
  type LoginValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    let active = true;
    void refreshSessionClient().then((restored) => {
      if (!active) {
        return;
      }
      if (restored) {
        routerRef.current.replace(nextPath as Route);
        routerRef.current.refresh();
        return;
      }
      setRestoring(false);
    });
    return () => {
      active = false;
    };
  }, [nextPath]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: new URLSearchParams({
          username: values.username,
          password: values.password,
          grant_type: "password",
        }),
      });
      router.replace(nextPath as Route);
      router.refresh();
    } catch (error) {
      setFormError(translateBackendError(error instanceof ApiError ? error.code : undefined));
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {restoring ? (
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {t("auth.restoringSession")}
        </p>
      ) : null}

      {/* Form, geri yükleme sürerken `hidden` ile görünmez; yine de SSR
          çıktısında kalır ki alan/autocomplete nitelikleri denetlenebilsin.
          Geri yükleme başarısız olursa form görünür, başarılıysa yönlendirilir. */}
      <form
        noValidate
        hidden={restoring}
        aria-hidden={restoring || undefined}
        onSubmit={onSubmit}
        className="flex flex-col gap-4"
      >
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

        <FormField label={t("auth.password")} error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              autoComplete="current-password"
              placeholder={t("auth.passwordPlaceholder")}
              {...register("password")}
            />
          )}
        </FormField>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
          >
            {t("auth.forgotLink")}
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {t("auth.loginButton")}
        </Button>
      </form>
    </div>
  );
}
