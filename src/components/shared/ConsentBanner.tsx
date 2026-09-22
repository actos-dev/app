"use client";

/**
 * KVKK çerez izni banner'ı (plan S-04, Faz 6).
 *
 * Davranış:
 *   - Sunucu tarafında çerez okunur; karar VERİLMEMİŞSE (`needsConsent`) bu
 *     bileşen render edilir. Böylece kararı olan kullanıcıya banner hiç
 *     gösterilmez; FOUC/atlayış olmaz.
 *   - "Kabul et" ve "Yalnızca gerekli" AYNI görsel ağırlıkta (dark pattern yok;
 *     ikisi de `secondary`, aynı boyut). Kabul edilirse rıza yazıldıktan SONRA
 *     `consent_updated` olayı kuyruğa girer ve hemen gönderilir; reddedilirse
 *     telemetry kapısı kapalı kalır ve tek istek bile çıkmaz.
 *   - Modal değildir: odak tuzağı yok, klavye ile tam erişilebilir, `role=region`
 *     ile son sırada duyurulur (ekran okuyucuyu kesintiye uğratmaz).
 */
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { setConsent } from "@/lib/consent";
import { flushTelemetry, track } from "@/lib/telemetry";
import { TelemetryEvents } from "@/lib/telemetry-events";

const LINK_CLASS =
  "text-primary underline underline-offset-2 transition-colors duration-150 ease-out hover:text-primary-hover";

type ConsentBannerProps = {
  /** Rıza çerezi yoksa `true`; karar verilmişse `false`. */
  needsConsent: boolean;
};

export function ConsentBanner({ needsConsent }: ConsentBannerProps) {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(needsConsent);

  if (!visible) {
    return null;
  }

  const decide = (granted: boolean) => {
    setConsent({ analytics: granted });
    if (granted) {
      // track kapısı artık açık: olay kuyruğa girer ve hemen gönderilir.
      track(TelemetryEvents.consentUpdated, { granted: true });
      flushTelemetry();
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={t("ariaLabel")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3"
    >
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-pop sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">{t("title")}</p>
            <p className="text-xs text-muted-foreground">
              {t.rich("description", {
                cookiePolicy: (chunks) => (
                  <Link href="/legal/cookie_policy" className={LINK_CLASS}>
                    {chunks}
                  </Link>
                ),
                privacyPolicy: (chunks) => (
                  <Link href="/legal/privacy_policy" className={LINK_CLASS}>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => decide(false)}>
            {t("reject")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => decide(true)}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
