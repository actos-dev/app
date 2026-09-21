/**
 * `/login` (plan Faz 2 / Birim 2.2).
 *
 * Sunucu bileşeni: oturum zaten varsa `?next=` hedefine (sanitize edilmiş)
 * yönlendirir; yoksa istemci formunu gösterir. Sessiz oturum geri yükleme ve
 * form gönderimi `LoginForm` içindedir.
 */
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { sanitizeNextPath } from "@/lib/auth/next-path";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [t, session, params] = await Promise.all([
    getTranslations("auth"),
    getSession(),
    searchParams,
  ]);

  const nextPath = sanitizeNextPath(typeof params.next === "string" ? params.next : null);
  // Şifre sıfırlama başarıyla `?reset=success`e yönlendirir (bkz. ResetPasswordForm).
  const resetDone = params.reset === "success";

  if (session) {
    redirect(nextPath as Route);
  }

  return (
    <AuthCard
      title={t("loginTitle")}
      description={t("loginDescription")}
      footer={
        <span>
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
          >
            {t("registerLink")}
          </Link>
        </span>
      }
    >
      {resetDone ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground"
        >
          {t("resetSuccessNotice")}
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthCard>
  );
}
