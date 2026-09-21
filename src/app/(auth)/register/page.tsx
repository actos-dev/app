/**
 * `/register` (plan U-01).
 *
 * Kayıt sonrası otomatik giriş denenmez; `RegisterForm` başarıda
 * `/verify-email?email=...` ekranına yönlendirir.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth");

  return (
    <AuthCard
      title={t("registerTitle")}
      description={t("registerDescription")}
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
      <RegisterForm />
    </AuthCard>
  );
}
