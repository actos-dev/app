/**
 * `/forgot-password` (plan Faz 2 / Birim 2.2b, U-01).
 *
 * Sunucu bileşeni: e-posta formunu aynı çerçevede gösterir. Başarı durumu
 * istemci formunda aynı sayfada yönetilir; hesap varlığı sızdırılmaz.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle") };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("forgotTitle")}
      description={t("forgotDescription")}
      footer={
        <span>
          {t("hasAccount")}{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
          >
            {t("loginLink")}
          </Link>
        </span>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
