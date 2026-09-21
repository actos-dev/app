"use client";

/**
 * E-posta doğrulama ekranı (plan U-01).
 *
 * - `token` varsa mount'ta `GET /auth/verify-email` çağrılır; başarı/hata
 *   durumu gösterilir.
 * - `token` yoksa "e-postanı kontrol et" bilgisi ve `POST /auth/resend-verification`
 *   formu gösterilir (e-posta alanı, A-01).
 *
 * Görünen metinlerin tümü i18n'den gelir; backend hata kodları
 * `translateBackendError` ile anahtara çevrilir.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ApiError, apiFetch } from "@/lib/api/client";
import { translateBackendError } from "@/lib/backend-errors";
import { cn } from "@/lib/utils";

type VerifyEmailProps = {
  token: string | null;
  email: string | null;
};

type VerifyState =
  | { status: "verifying" }
  | { status: "success" }
  | { status: "error"; key: string };

export function VerifyEmail({ token, email }: VerifyEmailProps) {
  const t = useTranslations();
  const [state, setState] = useState<VerifyState>(
    token ? { status: "verifying" } : { status: "error", key: "" },
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    void apiFetch("/api/v1/auth/verify-email", { query: { token } })
      .then(() => {
        if (active) {
          setState({ status: "success" });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            key: translateBackendError(error instanceof ApiError ? error.code : undefined),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (!token) {
    return <ResendVerification email={email} />;
  }

  if (state.status === "verifying") {
    return (
      <AuthCard title={t("auth.verifyTitle")} description={t("auth.verifyDescription")}>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {t("auth.verifyingEmail")}
        </p>
      </AuthCard>
    );
  }

  if (state.status === "success") {
    return (
      <AuthCard title={t("auth.verifySuccessTitle")} description={t("auth.verifySuccessDescription")}>
        <Link href="/login" className={cn("w-full", buttonVariants({ variant: "primary" }))}>
          {t("auth.loginLink")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("auth.verifyErrorTitle")} description={t("auth.verifyErrorDescription")}>
      <p
        role="alert"
        aria-live="assertive"
        className="rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative"
      >
        {t(state.key.length > 0 ? state.key : "apiErrors.invalidVerificationToken")}
      </p>
      <ResendVerification email={email} embedded />
      <Link
        href="/login"
        className={cn("text-sm text-primary transition-colors duration-150 ease-out hover:text-primary-hover")}
      >
        {t("auth.loginLink")}
      </Link>
    </AuthCard>
  );
}

type ResendVerificationProps = {
  email: string | null;
  /** Hata kartı içinde gömülü gösterimde başlık/açıklama tekrar edilmez. */
  embedded?: boolean;
};

function ResendVerification({ email, embedded = false }: ResendVerificationProps) {
  const t = useTranslations();
  const [value, setValue] = useState(email ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch("/api/v1/auth/resend-verification", {
        method: "POST",
        body: { username_or_email: value },
      });
      setMessage(t("auth.resendSuccess"));
    } catch (caught) {
      setError(translateBackendError(caught instanceof ApiError ? caught.code : undefined));
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-negative bg-surface px-3 py-2 text-sm text-negative"
        >
          {t(error)}
        </p>
      ) : null}

      <FormField label={t("auth.email")}>
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={t("auth.emailPlaceholder")}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        )}
      </FormField>

      <Button type="submit" loading={submitting} className="w-full">
        {t("auth.resendButton")}
      </Button>
    </form>
  );

  if (embedded) {
    return content;
  }

  return (
    <AuthCard title={t("auth.verifyTitle")} description={t("auth.verifyDescription")}>
      {content}
    </AuthCard>
  );
}
