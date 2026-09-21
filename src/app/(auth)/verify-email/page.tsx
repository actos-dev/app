/**
 * `/verify-email` (plan U-01).
 *
 * Sunucu bileşeni yalnız `token`/`email` sorgu parametrelerini okur ve
 * istemci bileşenine geçirir. Token yoksa SSR çıktısı "e-postanı kontrol et"
 * bilgisi ve yeniden gönderme formudur.
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { VerifyEmail } from "@/components/auth/VerifyEmail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("verifyTitle") };
}

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const email = typeof params.email === "string" ? params.email : null;

  return <VerifyEmail token={token} email={email} />;
}
