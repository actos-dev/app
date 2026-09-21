"use client";

/**
 * Profil yüklenemediğinde gösterilen geri dönüş (Faz 5 / Birim 5B.2).
 *
 * `(app)/layout` oturumu zaten doğrular; bu ekran yalnız backend 5xx/ağ
 * kesintisi içindir. "Tekrar dene" sunucu bileşenini `router.refresh()` ile
 * yeniden çalıştırır.
 */
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/shared/ErrorState";

export function ProfileUnavailable() {
  const t = useTranslations("profile");
  const router = useRouter();

  return (
    <ErrorState
      title={t("unavailableTitle")}
      description={t("unavailableDescription")}
      retry={{ label: t("retry"), onRetry: () => router.refresh() }}
    />
  );
}
