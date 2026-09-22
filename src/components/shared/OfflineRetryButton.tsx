"use client";

/**
 * Çevrimdışı sayfası "Tekrar dene" aksiyonu (Faz 6 / Birim 6.4, S-11).
 *
 * Sayfa sunucu bileşenidir; tarayıcı yeniden yüklemesi istemci gerektirdiği
 * için bu küçük istemci bileşeni ayrı tutulur. Yeniden yükleme, SW'nin
 * network-first gezinme stratejisiyle bağlantıyı yeniden dener.
 */
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function OfflineRetryButton() {
  const t = useTranslations("offline");

  return (
    <Button variant="primary" onClick={() => window.location.reload()}>
      {t("retry")}
    </Button>
  );
}
